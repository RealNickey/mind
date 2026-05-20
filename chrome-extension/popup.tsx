/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import type { ExtractedData } from './utils';

const Popup = () => {
    const [data, setData] = useState<ExtractedData | null>(null);
    const [tags, setTags] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:3000');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const buildFallbackData = (tab?: chrome.tabs.Tab): ExtractedData => ({
        title: tab?.title || 'Saved Item',
        url: tab?.url || '',
        description: '',
        image: '',
        favicon: '',
        content: '',
        text: '',
    });

    const isRestrictedUrl = (url?: string | null) => {
        if (!url) return true;
        return ['chrome://', 'edge://', 'about:', 'chrome-extension://', 'view-source:']
            .some((prefix) => url.startsWith(prefix));
    };

    useEffect(() => {
        chrome.storage.local.get(['token', 'apiBaseUrl'], (result) => {
            setToken((result.token as string) || null);
            setApiBaseUrl((result.apiBaseUrl as string) || 'http://localhost:3000');
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (!activeTab) {
                setStatusMessage('No active tab found.');
                setData(buildFallbackData());
                return;
            }

            if (!activeTab.id || isRestrictedUrl(activeTab.url)) {
                setStatusMessage('Preview unavailable for this page.');
                setData(buildFallbackData(activeTab));
                return;
            }

            chrome.tabs.sendMessage(activeTab.id, { action: 'extract' }, (response) => {
                if (chrome.runtime.lastError) {
                    setStatusMessage('Preview unavailable for this page.');
                    setData(buildFallbackData(activeTab));
                    return;
                }

                if (response && response.data) {
                    setStatusMessage(null);
                    setData(response.data);
                    return;
                }

                setStatusMessage('Preview unavailable for this page.');
                setData(buildFallbackData(activeTab));
            });
        });
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const res = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/api/items/create`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    ...data,
                    tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
                })
            });

            if (res.ok) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Saved to MyMind',
                    message: 'Successfully saved the page.'
                });
                window.close();
            } else {
                alert("Failed to save. Check console.");
                console.error(await res.text());
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            alert("Error saving " + message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (!data) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div style={{ width: 350, padding: 16, fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: 16, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.title || 'Untitled Page'}
            </h2>
            {statusMessage && (
                <div style={{ fontSize: 11, color: '#a16207', marginBottom: 8 }}>
                    {statusMessage}
                </div>
            )}
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>
                {data.description?.slice(0, 100)}...
            </p>
            {data.image && (
                <img src={data.image} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 16 }} />
            )}

            <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>Tags (comma separated)</label>
                <input 
                    type="text" 
                    value={tags} 
                    onChange={e => setTags(e.target.value)} 
                    placeholder="inspiration, tech, react..."
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: 4 }}
                />
            </div>

            <button 
                onClick={handleSave} 
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: loading ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? 'Saving...' : 'Save to MyMind'}
            </button>
        </div>
    );
};

const rootDiv = document.createElement('div');
rootDiv.id = 'root';
document.body.appendChild(rootDiv);
const root = createRoot(rootDiv);
root.render(<Popup />);
