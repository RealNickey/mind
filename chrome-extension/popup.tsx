import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const Popup = () => {
    const [data, setData] = useState<any>(null);
    const [tags, setTags] = useState<string>('');
    const [collectionId, setCollectionId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        chrome.storage.local.get(['token'], (result) => {
            setToken((result.token as string) || null);
        });

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            if (activeTab.id) {
                chrome.tabs.sendMessage(activeTab.id, { action: 'extract' }, (response) => {
                    if (response && response.data) {
                        setData(response.data);
                    }
                });
            }
        });
    }, []);

    const handleSave = async () => {
        if (!token) {
            alert("No token found. Please login to the web app first.");
            return;
        }
        
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/items/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...data,
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    collectionId: collectionId || undefined
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
        } catch (e) {
            alert("Error saving " + e);
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return <div style={{ padding: 20 }}>Please login to MyMind app to use the clipper.</div>;
    }

    if (!data) return <div style={{ padding: 20 }}>Loading...</div>;

    return (
        <div style={{ width: 350, padding: 16, fontFamily: 'sans-serif' }}>
            <h2 style={{ fontSize: 16, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {data.title || 'Untitled Page'}
            </h2>
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
