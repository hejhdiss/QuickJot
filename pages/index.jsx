// Copyright (c) 2025 Jernialo, Hejhdiss
// Licensed under the GNU GPLv3: https://www.gnu.org/licenses/gpl-3.0.html


import React, { useState, useEffect, useCallback } from 'react';

const MAX_NOTE_LENGTH = 400;
const UID_LENGTH = 6;
const API_BASE_URL = '/api/notes';

// Generate Random ID
const generateUID = () => {
    const characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < UID_LENGTH; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// -------------------------------------------------------
//           MAIN COMPONENT — APPLE + NOTION UI
// -------------------------------------------------------
export default function QuickJotApp() {
    const [noteContent, setNoteContent] = useState('');
    const [searchId, setSearchId] = useState('');
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '', visible: false });
    const [loading, setLoading] = useState(false);
    const [retrievedNote, setRetrievedNote] = useState(null);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editContent, setEditContent] = useState('');

    // Status Popups
    const showStatus = useCallback((message, type) => {
        setStatusMessage({ message, type, visible: true });
        setTimeout(() => {
            setStatusMessage(prev => ({ ...prev, visible: false }));
        }, 3500);
    }, []);

    // Clipboard Copy
    const copyToClipboard = useCallback((text) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showStatus(`Copied ID: ${text}`, 'success');
        } catch {
            showStatus('Copy failed. Please copy manually.', 'error');
        }
        document.body.removeChild(textarea);
    }, [showStatus]);

    // ---------------- SEARCH NOTE ----------------
    const searchNote = useCallback(async (idToSearch) => {
        const id = (idToSearch || searchId).trim().toUpperCase();
        setEditingNoteId(null);
        setRetrievedNote(null);

        if (id.length !== UID_LENGTH) {
            showStatus(`ID must be ${UID_LENGTH} characters.`, 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`);

            if (response.status === 404) {
                showStatus(`No note found with ID: ${id}`, 'error');
                return;
            }

            if (!response.ok) throw new Error("Search failed.");

            const noteData = await response.json();

            const note = {
                id: noteData.id,
                content: noteData.content,
                createdAt: new Date(noteData.createdAt),
                lastEditedAt: noteData.lastEditedAt ? new Date(noteData.lastEditedAt) : null,
            };

            setRetrievedNote(note);
            showStatus(`Note retrieved`, 'success');

        } catch (err) {
            showStatus(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [searchId, showStatus]);
    
    // ---------------- CHECK COLLISION ----------------
    // Check if UID exists in DB
	const checkUIDExists = useCallback(async (id) => {
	    try {
		const res = await fetch(`/api/notes/check?id=${id}`);
		const data = await res.json();
		return data.exists === true;
	    } catch (err) {
		console.error("UID check failed:", err);
		return true; // Treat as collision for safety
	    }
	}, []);


    // ---------------- SAVE NEW NOTE ----------------
    const saveNote = useCallback(async () => {
        const content = noteContent.trim();

        if (!content || content.length > MAX_NOTE_LENGTH) {
            showStatus(`1–${MAX_NOTE_LENGTH} characters allowed.`, 'error');
            return;
        }

        setLoading(true);

        try {
            // Generate collision-proof ID
		let id;
		let attempts = 0;
		do {
		    id = generateUID();
		    attempts++;
		    const exists = await checkUIDExists(id);
		    if (!exists) break;
		} while (attempts < 10);

		if (attempts >= 10) {
		    showStatus("Could not generate unique ID. Please try again.", "error");
		    setLoading(false);
		    return;
		}

            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, content }),
            });

            if (!response.ok) throw new Error("Failed to publish note");

            setNoteContent('');
            showStatus(`Note published! ID copied.`, 'success');
            copyToClipboard(id);

        } catch (err) {
            showStatus(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [noteContent, showStatus, copyToClipboard]);

    // ---------------- EDIT NOTE ----------------
    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    const saveEdit = useCallback(async () => {
        const content = editContent.trim();
        const id = editingNoteId;

        if (!content || content.length > MAX_NOTE_LENGTH) {
            showStatus(`Content must be 1–${MAX_NOTE_LENGTH} characters.`, 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) throw new Error("Update failed");

            setEditingNoteId(null);
            showStatus("Note updated", 'success');
            await searchNote(id);

        } catch (err) {
            showStatus(err.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [editContent, editingNoteId, searchNote, showStatus]);

    const cancelEdit = () => {
        setEditingNoteId(null);
        if (retrievedNote) searchNote(retrievedNote.id);
    };

    // ---------------- RENDER NOTE CARD ----------------
    const renderNoteCard = () => {
        if (!retrievedNote) {
            return (
                <p className="empty-hint">
                    Search for a note or create a new one.
                </p>
            );
        }

        const isEditing = editingNoteId === retrievedNote.id;

        return (
            <div className="note-card">
                <header className="note-header">
                    <div className="note-title">Retrieved Note</div>
                    <div className="note-id-tag">{retrievedNote.id}</div>
                </header>

                <div className="date-info">
                    <span>Created: {retrievedNote.createdAt.toLocaleString()}</span>
                    {retrievedNote.lastEditedAt && (
                        <span> • Edited: {retrievedNote.lastEditedAt.toLocaleString()}</span>
                    )}
                </div>

                {isEditing ? (
                    <>
                        <textarea
                            className="edit-area"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="edit-actions">
                            <button onClick={saveEdit} className="btn-green">Save</button>
                            <button onClick={cancelEdit} className="btn-red">Cancel</button>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="note-content">{retrievedNote.content}</p>
                        <div className="note-actions">
                            <button onClick={() => startEditing(retrievedNote)} className="btn-blue">Edit</button>
                            <button onClick={() => copyToClipboard(retrievedNote.id)} className="btn-gray">Copy ID</button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // =====================================================
    //                      UI DESIGN
    // =====================================================
    return (
        <>
            <style jsx global>{`
                body {
                    background: #f2f2f7;
                    font-family: -apple-system, BlinkMacSystemFont, "SF Pro", "Inter", sans-serif;
                    margin: 0;
                }

                .container {
                    max-width: 820px;
                    margin: 40px auto;
                    padding: 0 16px;
                }

                .app-header {
                    background: white;
                    padding: 24px;
                    border-radius: 20px;
                    box-shadow: 0px 8px 20px rgba(0,0,0,0.06);
                    display: flex;
                    justify-content: space-between;
                }

                .app-title {
                    font-size: 28px;
                    font-weight: 700;
                    color: #333;
                }

                .tagline {
                    font-size: 13px;
                    opacity: 0.55;
                }

                .card {
                    background: white;
                    padding: 24px;
                    border-radius: 20px;
                    box-shadow: 0px 5px 20px rgba(0,0,0,0.05);
                    margin-top: 24px;
                }

                .search-input {
                    width: 100%;
                    padding: 12px 15px;
                    border-radius: 14px;
                    border: 1px solid #c8c8cd;
                    font-size: 16px;
                }

                .apple-btn {
                    margin-top: 12px;
                    width: 100%;
                    padding: 12px;
                    font-size: 16px;
                    background: #007aff;
                    color: white;
                    border-radius: 12px;
                    border: none;
                    font-weight: 600;
                }

                .empty-hint {
                    text-align: center;
                    opacity: 0.6;
                    padding: 40px 0;
                }

                .note-card {
                    background: white;
                    padding: 24px;
                    border-radius: 20px;
                    box-shadow: 0px 5px 20px rgba(0,0,0,0.04);
                }

                .note-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                }

                .note-title {
                    font-size: 20px;
                    font-weight: 700;
                }

                .note-id-tag {
                    padding: 4px 10px;
                    background: #e5f3ff;
                    border-radius: 10px;
                    font-size: 12px;
                    color: #007aff;
                    font-weight: 600;
                    font-family: monospace;
                }

                .note-content {
                    padding: 16px 0;
                    font-size: 17px;
                    white-space: pre-wrap;
                }

                .note-actions button,
                .edit-actions button {
                    margin-right: 10px;
                    padding: 8px 14px;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 14px;
                }

                .btn-blue { background: #007aff; color: white; }
                .btn-gray { background: #ececec; }
                .btn-green { background: #34c759; color: white; }
                .btn-red { background: #ff3b30; color: white; }

                .edit-area {
                    width: 100%;
                    min-height: 120px;
                    border-radius: 14px;
                    padding: 12px;
                    font-size: 16px;
                    border: 1px solid #c8c8cd;
                }

                .status-box {
                    background: #007aff;
                    color: white;
                    padding: 13px;
                    border-radius: 12px;
                    font-size: 15px;
                    text-align: center;
                    margin-top: 16px;
                }

                .error { background: #ff3b30; }
                .success { background: #34c759; }
               .footer {
		    margin-top: 40px;
		    padding: 20px 24px;
		    background: #ffffff;
		    border-radius: 20px;
		    box-shadow: 0px 5px 20px rgba(0,0,0,0.05);
		    text-align: center;
		}

		.footer-title {
		    font-size: 16px;
		    font-weight: 700;
		    color: #333;
		    margin-bottom: 8px;
		}

		.footer-text {
		    font-size: 14px;
		    color: #666;
		    opacity: 0.8;
		    margin-bottom: 6px;
		    line-height: 1.6;
		}

		.footer-text.small {
		    font-size: 12px;
		    opacity: 0.6;
		}
	
.footer-copy {
    font-size: 12px;
    opacity: 0.6;
}
@media (max-width: 400px) {
    .app-header {
        flex-direction: column;
        text-align: center;
        gap: 6px;
    }

    .app-title {
        font-size: 24px;
    }

    .tagline {
        font-size: 12px;
    }

    .card {
        padding: 18px;
    }

    .note-content {
        font-size: 15px;
    }
}

/* Improve readability on very large displays */
@media (min-width: 1400px) {
    .container {
        max-width: 1000px;
    }
    .app-title {
        font-size: 32px;
    }
}
            `}</style>

            <div className="container">
                {/* ---------------- Header ---------------- */}
                <div className="app-header">
                    <div className="app-title">QuickJot</div>
                    <div className="tagline">A micro-note network.</div>
                </div>

                {/* ---------------- Status Message ---------------- */}
                {statusMessage.visible && (
                    <div className={`status-box ${statusMessage.type}`}>
                        {statusMessage.message}
                    </div>
                )}

                {/* ---------------- Search Box ---------------- */}
                <div className="card">
                    <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Find a Note by ID</h3>

                    <input
                        className="search-input"
                        placeholder="Enter 6-character ID"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchNote()}
                        maxLength={UID_LENGTH}
                    />

                    <button
                        className="apple-btn"
                        onClick={() => searchNote()}
                        disabled={loading}
                    >
                        {loading ? "Searching…" : "Search"}
                    </button>
                </div>

                {/* ---------------- Search Result ---------------- */}
                <div className="card">
                    {renderNoteCard()}
                </div>

                {/* ---------------- Create New Note ---------------- */}
                <div className="card">
                    <h3 style={{ fontWeight: 600, fontSize: 18, marginBottom: 10 }}>Create New Note</h3>

                    <textarea
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        maxLength={MAX_NOTE_LENGTH}
                        placeholder="Write something…"
                        className="edit-area"
                        style={{ minHeight: '120px' }}
                    />

                    <div style={{ marginTop: 8, opacity: 0.6 }}>
                        {noteContent.length} / {MAX_NOTE_LENGTH}
                    </div>

                    <button
                        className="apple-btn"
                        style={{ marginTop: 14 }}
                        onClick={saveNote}
                        disabled={loading}
                    >
                        {loading ? "Saving…" : "Publish Note"}
                    </button>
                </div>
                {/* ---------------- Footer ---------------- */}
<div className="footer">
    <p className="footer-title">QuickJot • Micro-Note Network</p>

    <p className="footer-text">
        • All status messages - including errors, success confirmations, and automatic ID-generation notices - 
        appear <strong>directly below the main QuickJot header</strong> and 
        <strong> above the Search panel</strong>.<br /><br />

        • Every new note receives a unique 6-character ID, which is 
        <strong> automatically copied to your clipboard</strong> after a successful save.<br /><br />

        • ⚠️ QuickJot uses <strong>free-tier database capacity</strong>.  
        If storage becomes full, new notes may <strong>fail to save</strong>.
    </p>

    <p className="footer-text small">
        QuickJot is designed for lightweight, temporary notes.  
        Avoid storing private, sensitive, or long-form data.
    </p>

    <p className="footer-copy">
        © {new Date().getFullYear()} hejhdiss — All rights reserved.  
        <br />
        <a href="https://github.com/hejhdiss" target="_blank" style={{ color: "#007aff", textDecoration: "none", fontWeight: 600 }}>
            GitHub @hejhdiss
        </a>
    </p>
</div>



            </div>
        </>
    );
}

