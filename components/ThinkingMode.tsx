import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateWithThinking, MultimodalContent } from '../services/geminiService';
import { Spinner } from './Spinner';
import { PaperclipIcon, MicrophoneIcon, StopCircleIcon, XCircleIcon, SendIcon, LogoIcon } from './Icons';

interface Attachment {
    id: string;
    file: File;
    preview: string;
}

interface Message {
    id: string;
    role: 'user' | 'model';
    text?: string;
    images?: string[];
    audio?: string;
    isLoading?: boolean;
}


export const ThinkingMode: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState<string>('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'recorded'>('idle');
    const [recordedAudio, setRecordedAudio] = useState<Attachment | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight);
    }, [messages]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            // FIX: Explicitly type the 'file' parameter in the map function to ensure correct type inference.
            const newAttachments: Attachment[] = files.map((file: File) => ({
                id: `${file.name}-${Date.now()}`,
                file,
                preview: URL.createObjectURL(file)
            }));
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(att => att.id !== id));
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = event => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, { type: 'audio/webm' });
                setRecordedAudio({ id: `audio-${Date.now()}`, file: audioFile, preview: audioUrl });
                setRecordingStatus('recorded');
                 // Stop the track to turn off the microphone indicator
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setRecordingStatus('recording');
        } catch (err) {
            setError("Microphone access was denied. Please enable it in your browser settings.");
            console.error("Error accessing microphone:", err);
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };

    const handleSend = useCallback(async () => {
        if (loading || (!inputText.trim() && attachments.length === 0 && !recordedAudio)) {
            return;
        }

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            text: inputText,
            images: attachments.map(a => a.preview),
            audio: recordedAudio?.preview
        };

        const modelMessage: Message = {
            id: `model-${Date.now()}`,
            role: 'model',
            isLoading: true
        };
        
        setMessages(prev => [...prev, userMessage, modelMessage]);
        setLoading(true);
        setError(null);

        const content: MultimodalContent = [inputText];
        attachments.forEach(a => content.push(a.file));
        if (recordedAudio) {
            content.push(recordedAudio.file);
        }
        
        // Reset inputs immediately
        setInputText('');
        setAttachments([]);
        setRecordedAudio(null);
        setRecordingStatus('idle');

        try {
            const result = await generateWithThinking(content);
            setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, text: result, isLoading: false } : m));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => prev.map(m => m.id === modelMessage.id ? { ...m, text: `Error: ${errorMessage}`, isLoading: false } : m));
        } finally {
            setLoading(false);
        }
    }, [inputText, attachments, recordedAudio, loading]);

    const renderMessageContent = (message: Message) => (
        <div className={`p-4 rounded-2xl max-w-lg lg:max-w-xl ${message.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
            {message.isLoading && <Spinner />}
            {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
            {message.images && message.images.length > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                    {message.images.map((img, index) => <img key={index} src={img} alt={`attachment ${index}`} className="rounded-lg object-cover w-full h-auto" />)}
                </div>
            )}
            {message.audio && (
                <div className="mt-2">
                    <audio controls src={message.audio} className="w-full h-10" />
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
            <div className="text-center p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                <p className="text-sm text-gray-400">Ask me anything about the app, or get strategic advice.</p>
            </div>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map(message => (
                    <div key={message.id} className={`flex items-end gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {message.role === 'model' && <LogoIcon className="h-8 w-8 text-blue-500 flex-shrink-0" />}
                        {renderMessageContent(message)}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-gray-700 bg-gray-800">
                {error && <div className="bg-red-900/50 text-red-300 p-2 rounded-md text-center text-sm mb-2">{error}</div>}
                
                {(attachments.length > 0 || recordedAudio) && (
                    <div className="mb-2 p-2 bg-gray-700/50 rounded-lg flex flex-wrap gap-2">
                        {attachments.map(att => (
                            <div key={att.id} className="relative">
                                <img src={att.preview} alt="upload preview" className="h-16 w-16 object-cover rounded"/>
                                <button onClick={() => removeAttachment(att.id)} className="absolute -top-1 -right-1 bg-gray-800 rounded-full text-white">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                         {recordedAudio && (
                             <div className="relative p-2 bg-gray-900 rounded-lg flex items-center gap-2">
                                <audio controls src={recordedAudio.preview} className="h-8"/>
                                <button onClick={() => setRecordedAudio(null)} className="absolute -top-1 -right-1 bg-gray-800 rounded-full text-white">
                                    <XCircleIcon className="w-5 h-5"/>
                                </button>
                            </div>
                         )}
                    </div>
                )}
                
                <div className="flex items-center gap-2 bg-gray-700 rounded-xl p-2">
                    <label htmlFor="file-upload" className="p-2 text-gray-400 hover:text-white cursor-pointer rounded-full hover:bg-gray-600">
                        <PaperclipIcon className="w-6 h-6"/>
                        <input id="file-upload" type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>

                    {recordingStatus === 'idle' && (
                         <button onClick={handleStartRecording} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-600">
                            <MicrophoneIcon className="w-6 h-6"/>
                        </button>
                    )}
                     {recordingStatus === 'recording' && (
                         <button onClick={handleStopRecording} className="p-2 text-red-500 rounded-full hover:bg-gray-600 animate-pulse">
                            <StopCircleIcon className="w-6 h-6"/>
                        </button>
                    )}
                     {recordingStatus === 'recorded' && (
                         <button className="p-2 text-green-500 rounded-full cursor-default">
                            <MicrophoneIcon className="w-6 h-6"/>
                        </button>
                    )}
                    
                    <textarea
                        rows={1}
                        className="flex-1 bg-transparent text-white placeholder-gray-400 resize-none focus:outline-none p-2"
                        placeholder="Type your message, upload an image, or record audio..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                     <button onClick={handleSend} disabled={loading || (!inputText.trim() && attachments.length === 0 && !recordedAudio)} className="p-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors">
                        <SendIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
