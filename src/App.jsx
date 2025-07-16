// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { loadModel, predict } from './utils/modelUtils';
import './index.css';

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // 화면에 보여줄 이미지 URL 상태
  const imageRef = useRef(null); // Teachable Machine 모델 예측에 사용할 숨겨진 이미지 ref

  // 컴포넌트 마운트 시 모델 로드
  useEffect(() => {
    const initModel = async () => {
      setLoading(true);
      try {
        await loadModel();
        setModelLoaded(true);
      } catch (error) {
        alert(`모델 로드 중 오류 발생: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    initModel();
  }, []);

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return; // 파일이 선택되지 않은 경우

    if (!modelLoaded) {
      alert("모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    setPredictionResult(null); // 새로운 업로드 시 기존 결과 초기화
    setUploadedImageUrl(null); // 새로운 업로드 시 화면 이미지 초기화

    const reader = new FileReader();
    reader.onload = async (e) => {
      const imgDataUrl = e.target.result; // Data URL 획득

      // 1. 화면에 보여줄 이미지 URL 업데이트 (React가 <img>를 렌더링)
      setUploadedImageUrl(imgDataUrl);

      // 2. 모델 예측에 사용할 이미지 로드 및 예측
      // 이 부분은 imageRef.current가 DOM에 연결된 후에 실행되어야 합니다.
      // useEffect를 사용하여 uploadedImageUrl이 업데이트된 후에 예측을 수행하는 것이 더 견고할 수 있습니다.
      // 하지만, 빠른 예측을 위해 여기서 바로 시도합니다.
      // *주의*: imageRef.current는 다음 렌더링 사이클에 연결될 수 있으므로, 바로 접근 시 null일 수 있습니다.
      // 따라서, 아래에서처럼 ref가 아닌 새로운 Image 객체를 만들어서 predict에 전달하는 것이 더 안전합니다.

      const tempImgForPrediction = new Image();
      tempImgForPrediction.src = imgDataUrl;

      tempImgForPrediction.onload = async () => {
        // 이제 tempImgForPrediction은 예측에 사용될 수 있는 완전한 이미지입니다.
        try {
          const predictions = await predict(tempImgForPrediction); // tempImgForPrediction 사용
          setPredictionResult(predictions);
          console.log("예측 결과:", predictions);
        } catch (error) {
          alert(`이미지 예측 중 오류 발생: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      tempImgForPrediction.onerror = (error) => {
          console.error("예측용 이미지 로드 중 오류 발생:", error);
          alert("이미지를 로드할 수 없습니다. 유효한 이미지 파일인지 확인해주세요.");
          setLoading(false);
      };
    };
    reader.readAsDataURL(file); // 파일을 Data URL로 읽기 시작
  };

  // 모델 로딩 중 UI
  if (!modelLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">
          모델 로딩 중... {loading && <span className="animate-pulse">(잠시만 기다려주세요)</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800 text-center">대통령상 테스트</h1>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition duration-300 ease-in-out text-lg mb-4 shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md text-center"
      >
        사진 업로드
      </label>

      {loading && (
        <p className="text-lg text-gray-600 mt-4 animate-pulse text-center w-full">사진 분석 중...</p>
      )}

      <img ref={imageRef} alt="Hidden for prediction" style={{ display: 'none' }} />

      {uploadedImageUrl && (
        <div className="mt-8 p-4 bg-white rounded-lg shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800">업로드된 사진</h2>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="max-w-full h-auto rounded-lg shadow-inner border border-gray-200 mx-auto"
          />
        </div>
      )}

      {predictionResult && (
        <div className="mt-8 p-6 bg-white rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800">예측 결과</h2>
          {predictionResult.map((p, index) => (
            <p key={index} className="text-lg md:text-xl text-gray-700 mb-2">
              <span className="font-semibold">{p.className}:</span>{' '}
              <span className="text-blue-600">{Math.round(p.probability * 100)}%</span>
            </p>
          ))}
          <button
            onClick={() => {
              setPredictionResult(null);
              setUploadedImageUrl(null);
              const fileInput = document.getElementById('file-upload');
              if (fileInput) fileInput.value = '';
            }}
            className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out shadow-md w-full max-w-xs mx-auto"
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}

export default App;