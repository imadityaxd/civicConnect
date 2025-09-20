import React, { useState, useRef } from "react";
import axios from "axios";

// --- Helper Icon Components (for clarity) ---
const LocationIcon = () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>;
const SpinnerIcon = () => <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;

export default function ReportForm({ api, user }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState({ type: "", content: "" });

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // --- Form Reset Logic ---
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setPhotos([]);
    setIsCameraActive(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  // --- Media Handlers ---
  const handleFiles = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - photos.length);
    const readers = files.map(file => new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    }));
    Promise.all(readers)
      .then(newPhotos => setPhotos(prev => [...prev, ...newPhotos]))
      .catch(() => setMessage({ type: "error", content: "Error reading files." }));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch {
      setMessage({ type: "error", content: "Camera access denied or not available." });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || photos.length >= 3) return;
    const ctx = canvasRef.current.getContext("2d");
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    setPhotos(prev => [...prev, dataUrl]);
    setIsCameraActive(false); // Optionally turn off camera after capture
  };
  
  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  // --- Location Handler ---
  const fetchLocation = () => {
    if (!navigator.geolocation) {
      return setMessage({ type: "error", content: "Geolocation is not supported by your browser." });
    }
    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setIsFetchingLocation(false);
      },
      () => {
        setMessage({ type: "error", content: "Unable to retrieve your location." });
        setIsFetchingLocation(false);
      }
    );
  };

  // --- Submission Handler ---
  const submit = async (e) => {
    e.preventDefault();
    if (!user) return setMessage({ type: "error", content: "Please log in to submit an issue." });
    if (!title || !description || !location) return setMessage({ type: "error", content: "Please fill all required fields." });
    
    setIsSubmitting(true);
    setMessage({ type: "", content: "" });
    try {
      const resp = await axios.post(
        `${api}/issues`,
        { title, description, location, photos },
        { headers: { "x-user": user.username } }
      );
      if (resp.data.ok) {
        setMessage({ type: "success", content: "Issue submitted successfully! Thank you." });
        resetForm();
      }
    } catch (err) {
      setMessage({ type: "error", content: err?.response?.data?.error || "An error occurred during submission." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white max-w-2xl mx-auto p-6 md:p-8 rounded-2xl shadow-xl">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">Report a Civic Issue</h2>
      <p className="text-gray-500 mb-6">Help us improve our community by reporting issues you see.</p>

      <form className="space-y-8" onSubmit={submit}>

        {/* --- Step 1: Photographic Evidence --- */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center mb-4">
            <span className="bg-blue-600 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">1</span>
            Add Photographic Evidence
          </h3>
          
          {/* Photo Previews */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              {photos.map((p, idx) => (
                <div key={idx} className="relative group">
                  <img src={p} alt={`preview ${idx}`} className="h-28 w-full object-cover rounded-lg shadow-md" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                </div>
              ))}
            </div>
          )}

          {/* Camera View */}
          {isCameraActive && (
            <div className="mb-4">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg border mb-2" />
              <button type="button" onClick={capturePhoto} disabled={photos.length >= 3}
                className="w-full px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-sm hover:bg-purple-700 disabled:bg-purple-400">
                Capture Photo
              </button>
            </div>
          )}

          {/* Upload / Camera Buttons */}
          {!isCameraActive && photos.length < 3 && (
            <div className="flex gap-2">
              <input type="file" accept="image/*" multiple onChange={handleFiles} ref={fileInputRef} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current.click()}
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-lg hover:bg-gray-50 hover:border-blue-500">
                Upload Files
              </button>
              <button type="button" onClick={startCamera}
                className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-500 font-semibold rounded-lg hover:bg-gray-50 hover:border-blue-500">
                Use Camera
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">You can add up to 3 photos.</p>
          <canvas ref={canvasRef} className="hidden"></canvas>
        </div>

        {/* --- Step 2: Issue Details --- */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center">
            <span className="bg-blue-600 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">2</span>
            Describe the Issue
          </h3>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-600 mb-1">Title</label>
            <input id="title" type="text" placeholder="e.g., Large pothole on main street" value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-600 mb-1">Description</label>
            <textarea id="description" placeholder="Provide details about the issue, its size, and impact." value={description} onChange={e => setDescription(e.target.value)} required rows={4}
              className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>

        {/* --- Step 3: Location --- */}
        <div>
           <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 flex items-center mb-4">
            <span className="bg-blue-600 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">3</span>
            Pinpoint the Location
          </h3>
          <label htmlFor="location" className="block text-sm font-medium text-gray-600 mb-1">Address or Coordinates</label>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><LocationIcon/></span>
              <input id="location" type="text" placeholder="Enter address or use GPS" value={location} onChange={e => setLocation(e.target.value)} required
                className="w-full pl-10 border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <button type="button" onClick={fetchLocation} disabled={isFetchingLocation}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-sm hover:bg-green-700 disabled:bg-green-400 flex items-center">
              {isFetchingLocation ? <SpinnerIcon/> : "Use GPS"}
            </button>
          </div>
        </div>
        
        {/* --- Submission & Feedback --- */}
        <div>
          {message.content && (
            <div className={`p-3 rounded-lg text-sm mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message.content}
            </div>
          )}
          <button type="submit" disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-sm hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center">
            {isSubmitting ? <SpinnerIcon/> : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}