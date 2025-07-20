'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';

function Tabs(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const tabIndex = searchParams?.get('tab') === 'custom' ? 1 : 0;

  const router = useRouter();
  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  let tabs = React.Children.map(props.children, (child, index) => {
    return (
      <button
        className="lk-button"
        onClick={() => {
          if (onTabSelected) {
            onTabSelected(index);
          }
        }}
        aria-pressed={tabIndex === index}
      >
        {/* @ts-ignore */}
        {child?.props.label}
      </button>
    );
  });

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {/* @ts-ignore */}
      {props.children[tabIndex]}
    </div>
  );
}

function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(`/rooms/${generateRoomId()}`);
    }
  };
  return (
    <div className={styles.tabContent}>
      <button
        style={{
          marginTop: '1rem',
          background: '#22c55e',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: 18,
          cursor: 'pointer',
          boxShadow: '0 2px 8px 0 rgba(34,197,94,0.08)'
        }}
        onClick={startMeeting}
      >
        Start Meeting
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab(props: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    <form className={styles.tabContent} onSubmit={onSubmit}>
      <p style={{ marginTop: 0 }}>
        Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
      </p>
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="LiveKit Server URL: wss://*.livekit.cloud"
        required
      />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={5}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }}
      />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

export default function Page() {
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
            <h2 style={{ margin: 0, fontWeight: 700, fontSize: 24, color: '#222' }}>
              Join your video call with HealthCopilot
            </h2>
            <DemoMeetingTab label="Demo" />
          </div>
        </main>
      </div>
    </div>
  );
}
