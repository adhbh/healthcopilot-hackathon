'use client';

import React from 'react';
import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { KeyboardShortcuts } from '@/lib/KeyboardShortcuts';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LocalUserChoices,
  PreJoin,
  RoomContext,
  VideoConference,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  RoomEvent,
  TrackPublishDefaults,
  VideoCaptureOptions,
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import { useSetupE2EE } from '@/lib/useSetupE2EE';
import { useLowCPUOptimizer } from '@/lib/usePerfomanceOptimiser';

const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, []);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  if (connectionDetails !== undefined && preJoinChoices !== undefined) {
    return (
      <VideoConferenceComponent
        connectionDetails={connectionDetails}
        userChoices={preJoinChoices}
        options={{ codec: props.codec, hq: props.hq }}
      />
    );
  } else {
    return (
      <div style={{ display: 'flex', height: '100vh', background: '#fafbfc' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220,
          background: '#fff',
          borderRight: '1px solid #ececec',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 0 0 0',
          boxShadow: '2px 0 8px 0 rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
            <img
              src="/images/health_copilot_logo.png"
              alt="Health Copilot Logo"
              style={{ width: 40, height: 40, borderRadius: 12, marginRight: 12, objectFit: 'cover' }}
            />
            <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>HealthCopilot</span>
          </div>
          <nav style={{ width: '100%' }}>
          </nav>
          <div style={{ flexGrow: 1 }} />
          <div style={{ padding: '24px 0', width: '100%', textAlign: 'center', borderTop: '1px solid #ececec' }}>
            <span style={{ color: '#888', fontSize: 14 }}>N</span>
            <span style={{ marginLeft: 8, color: '#888', fontSize: 14 }}>User</span>
          </div>
        </aside>
        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top Bar */}
          <header style={{
            height: 64,
            background: '#fff',
            borderBottom: '1px solid #ececec',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.02)'
          }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>Join Meeting</span>
            </div>
          </header>
          {/* Main Card */}
          <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px',
            minHeight: 0,
          }}>
            <div style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
              padding: 32,
              minWidth: 400,
              maxWidth: 520,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}>
              <PreJoin
                defaults={preJoinDefaults}
                onSubmit={handlePreJoinSubmit}
                onError={handlePreJoinError}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }
}

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const keyProvider = new ExternalE2EEKeyProvider();
  const { worker, e2eePassphrase } = useSetupE2EE();
  const e2eeEnabled = !!(e2eePassphrase && worker);

  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.userChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      red: !e2eeEnabled,
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
      e2ee: keyProvider && worker && e2eeEnabled ? { keyProvider, worker } : undefined,
    };
  }, [props.userChoices, props.options.hq, props.options.codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  React.useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.EncryptionError, handleEncryptionError);
    room.on(RoomEvent.MediaDevicesError, handleError);

    if (e2eeSetupComplete) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken,
          connectOptions,
        )
        .catch((error) => {
          handleError(error);
        });
      if (props.userChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.userChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }
    }
    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.EncryptionError, handleEncryptionError);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [e2eeSetupComplete, room, props.connectionDetails, props.userChoices]);

  const lowPowerMode = useLowCPUOptimizer(room);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  React.useEffect(() => {
    if (lowPowerMode) {
      console.warn('Low power mode enabled');
    }
  }, [lowPowerMode]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#fafbfc' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220,
        background: '#fff',
        borderRight: '1px solid #ececec',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 0 0 0',
        boxShadow: '2px 0 8px 0 rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <img
            src="/images/health_copilot_logo.png"
            alt="Health Copilot Logo"
            style={{ width: 40, height: 40, borderRadius: 12, marginRight: 12, objectFit: 'cover' }}
          />
          <span style={{ fontWeight: 700, fontSize: 18, color: '#222' }}>HealthCopilot</span>
        </div>
        <nav style={{ width: '100%' }}>
        </nav>
        <div style={{ flexGrow: 1 }} />
        <div style={{ padding: '24px 0', width: '100%', textAlign: 'center', borderTop: '1px solid #ececec' }}>
          <span style={{ color: '#888', fontSize: 14 }}>N</span>
          <span style={{ marginLeft: 8, color: '#888', fontSize: 14 }}>User</span>
        </div>
      </aside>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{
          height: 64,
          background: '#fff',
          borderBottom: '1px solid #ececec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          boxShadow: '0 2px 8px 0 rgba(0,0,0,0.02)'
        }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>Meeting Room: {props.connectionDetails?.roomName || ''}</span>
            <span style={{ marginLeft: 16, color: '#888', fontSize: 16 }}>{props.connectionDetails?.participantName || ''}</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button style={{
              background: '#22c55e',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)'
            }}>Chat</button>
            <button style={{
              background: '#fff',
              color: '#22c55e',
              border: '1.5px solid #22c55e',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer'
            }}>Leave</button>
          </div>
        </header>
        {/* Stats Cards */}
        <div style={{
          display: 'flex', gap: 24, padding: '32px 32px 0 32px'
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)', padding: 24, flex: 1, minWidth: 180
          }}>
            <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>Participants</div>
            <div style={{ fontWeight: 700, fontSize: 28, color: '#222' }}>{room.numParticipants}</div>
          </div>
          <div style={{
            background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)', padding: 24, flex: 1, minWidth: 180
          }}>
            <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>Connection</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#22c55e' }}>Connected</div>
          </div>
        </div>
        {/* Video Conference Card */}
        <main style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '32px',
          minHeight: 0,
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
            padding: 24,
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}>
            <RoomContext.Provider value={room}>
              <KeyboardShortcuts />
              <VideoConference
                chatMessageFormatter={formatChatMessageLinks}
                SettingsComponent={SHOW_SETTINGS_MENU ? SettingsMenu : undefined}
              />
              <DebugMode />
              <RecordingIndicator />
            </RoomContext.Provider>
          </div>
        </main>
      </div>
    </div>
  );
}
