// src/components/WebcamCapture.jsx
import React, { useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user" // Use the front camera
};

function WebcamCapture({ onCapture, onCancel }) {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null); // Data URL of the captured photo
  const [isCameraReady, setIsCameraReady] = useState(false); // State to track if camera is ready

  // Function to capture photo
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  // Function to retake photo
  const retake = () => {
    setImgSrc(null); // Clear the captured photo to show webcam again
    setIsCameraReady(false); // Reset camera ready state for retake
  };

  // Function to confirm captured photo and pass to parent
  const confirmCapture = () => {
    if (imgSrc) {
      onCapture(imgSrc); // Pass image data to parent component
    }
  };

  // Callback when camera stream is ready
  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Callback if camera access fails
  const handleUserMediaError = useCallback((error) => {
    console.error("Camera access error:", error);
    alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요."); // Inform user about permission issue
    onCancel(); // Cancel webcam mode
  }, [onCancel]);

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg w-full max-w-md">
      {!imgSrc ? (
        <>
          {!isCameraReady && (
            <p className="text-lg text-gray-600 mb-4 animate-pulse">카메라 로딩 중...</p>
          )}
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className={`rounded-lg shadow-inner w-full h-auto ${isCameraReady ? '' : 'hidden'}`} // Hide webcam until ready
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
          />
          {isCameraReady && ( // Only show buttons when camera is ready
            <button
              onClick={capture}
              className="mt-4 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md w-full"
            >
              사진 찍기
            </button>
          )}
          <button
            onClick={onCancel}
            className={`mt-2 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md w-full ${isCameraReady ? '' : 'mt-4'}`} // Adjust margin if loading message is present
          >
            취소
          </button>
        </>
      ) : (
        <>
          <img src={imgSrc} alt="Captured" className="rounded-lg shadow-inner w-full h-auto" />
          <div className="flex mt-4 space-x-2 w-full">
            <button
              onClick={confirmCapture}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
            >
              사용하기
            </button>
            <button
              onClick={retake}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md"
            >
              다시 찍기
            </button>
          </div>
          <button
            onClick={onCancel}
            className="mt-2 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md w-full"
          >
            취소
          </button>
        </>
      )}
    </div>
  );
}

export default WebcamCapture;
