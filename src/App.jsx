import React, { useState, useEffect, useRef } from 'react';
import { loadModel, predict } from './utils/modelUtils';
import WebcamCapture from './components/WebcamCapture';
import './index.css';
import dosaimage from './assets/dosaimage.png';

const Theme = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isWebcamMode, setIsWebcamMode] = useState(false);

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  });

  const imageRef = useRef(null);

  useEffect(() => {
    const initModel = async () => {
      setIsModelLoading(true);
      try {
        await loadModel();
        setModelLoaded(true);
      } catch (error) {
        console.error("모델 로드 중 오류 발생:", error);
      } finally {
        setIsModelLoading(false);
      }
    };
    initModel();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);

    if (theme === Theme.DARK || (theme === Theme.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === Theme.SYSTEM) {
        e.matches ? root.classList.add('dark') : root.classList.remove('dark');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : prev === Theme.DARK ? Theme.SYSTEM : Theme.LIGHT);
  };

  const processImageForPrediction = async (imgDataUrl) => {
    setIsImageAnalyzing(true);
    setPredictionResult(null);
    setUploadedImageUrl(null);

    const tempImg = new Image();
    tempImg.src = imgDataUrl;

    tempImg.onload = async () => {
      try {
        const results = await predict(tempImg);
        setPredictionResult(results);
        setUploadedImageUrl(imgDataUrl);
        console.log("전체 예측 결과:", results);
      } catch (error) {
        console.error("이미지 예측 중 오류 발생:", error);
      } finally {
        setIsImageAnalyzing(false);
      }
    };

    tempImg.onerror = (error) => {
      console.error("예측용 이미지 로드 중 오류 발생:", error);
      setIsImageAnalyzing(false);
    };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!modelLoaded) return console.warn("모델이 아직 로드되지 않았습니다.");

    const reader = new FileReader();
    reader.onload = (e) => processImageForPrediction(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleWebcamCapture = (imageSrc) => {
    setIsWebcamMode(false);
    processImageForPrediction(imageSrc);
  };

  const handleWebcamCancel = () => {
    setIsWebcamMode(false);
    setIsImageAnalyzing(false);
  };

  const getHumorousMessage = (prob) => {
    const p = Math.round(prob * 100);
    const messages = {
      '95+': ["🎉 맙소사! 당신은 이미 대통령이십니다!", "✨ 빛이 나는군요!"],
      '90-94': ["🌟 대통령의 기운이 뿜어져 나옵니다!", "💖 국민들이 당신을 기다립니다!"],
      '80-89': ["🌟 거의 대통령급 관상이네요!", "👍 훌륭한 리더의 얼굴입니다!"],
      '70-79': ["👍 국무총리는 가능할지도?", "🤔 관상 전문가도 놀랄 결과!"],
      '60-69': ["😅 장관까진 가능할지도?", "💡 잠재력 폭발!"],
      '50-59': ["😅 적당한 운은 타고났네요.", "🤔 음... 반은 왔습니다."],
      '40-49': ["😂 대통령과는 거리가 좀 있지만,", "👀 인성이 중요하죠!"],
      '30-39': ["👀 걱정 마세요!", "🤷‍♀️ 당신의 행복 지수는 높을 겁니다!"],
      '10-29': ["😂 대통령상과는 거리가 멀지만,", "🤷‍♀️ 독특함 최고!"],
      '0-9': ["🤣 자유로운 영혼의 소유자입니다!", "🤔 혹시 파리가 찍힌 건 아닐까요?"],
    };
    let key = Object.keys(messages).find(range => {
      if (range === '95+') return p >= 95;
      const [min, max] = range.split('-').map(Number);
      return p >= min && p <= max;
    }) || '0-9';

    return messages[key][Math.floor(Math.random() * messages[key].length)];
  };

  if (isWebcamMode) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">카메라 촬영</h1>
        <WebcamCapture onCapture={handleWebcamCapture} onCancel={handleWebcamCancel} />
      </div>
    );
  }

  const presidentProb = predictionResult?.totalPresidentProbability ? parseFloat(predictionResult.totalPresidentProbability) : 0;
  const displayPresidentProb = isNaN(presidentProb) ? 'N/A' : Math.round(presidentProb * 100) + '%';
  const humorousMessage = isNaN(presidentProb) ? '예측 결과를 불러올 수 없습니다.' : getHumorousMessage(presidentProb);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-2 sm:p-4">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md"
        title="테마 변경"
      >
        {theme === Theme.LIGHT && '☀️'}
        {theme === Theme.DARK && '🌙'}
        {theme === Theme.SYSTEM && '💻'}
      </button>

      <h1 className="text-3xl font-bold mb-2 text-gray-800 dark:text-gray-200 text-center">대통령상 테스트</h1>
      <p className="text-base text-gray-600 dark:text-gray-400 mb-2 text-center">AI가 분석해주는 관상테스트</p>
      <p className="text-base text-red-600 font-bold mb-6 text-center">
        <span className="text-xl font-extrabold">0.001%</span>의 사람만이 <span className="underline">대통령의 얼굴</span>을 가졌습니다.
      </p>

      {/* 도사 이미지 */}
      {!predictionResult && (
        <div className="my-8 flex items-center justify-center w-40 h-40 rounded-full bg-white dark:bg-gray-800 shadow-lg border-4 border-gray-300 dark:border-gray-700">
          {!modelLoaded && isModelLoading ? (
            <p className="text-center text-gray-700 dark:text-gray-300 animate-pulse">모델 로딩 중...</p>
          ) : (
            <img src={dosaimage} alt="도사" className="rounded-full w-full h-full object-cover" />
          )}
        </div>
      )}

      {/* 업로드 및 카메라 버튼 */}
      {!predictionResult && (
        <div className="flex flex-col sm:flex-row gap-4 mb-4 w-full max-w-xs sm:max-w-md">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg cursor-pointer text-lg shadow-md text-center"
          >
            사진 업로드
          </label>
          <button
            onClick={() => setIsWebcamMode(true)}
            className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg text-lg shadow-md"
          >
            카메라 촬영
          </button>
        </div>
      )}

      {isImageAnalyzing && (
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 animate-pulse text-center w-full">사진 분석 중...</p>
      )}

      <img ref={imageRef} alt="Hidden for prediction" style={{ display: 'none' }} />

      {uploadedImageUrl && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">업로드된 사진</h2>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="w-full h-auto max-h-[40vh] object-contain rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 mx-auto"
          />
        </div>
      )}

      {/* 예측 결과 */}
      {predictionResult && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">대통령 관상: </span>
            <span className="text-blue-600 font-bold">{displayPresidentProb}</span>
          </p>
          <p className="text-lg text-gray-700 dark:text-gray-300 mt-4 mb-6">
            {humorousMessage}
          </p>

          {/* 다시 시도 */}
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

      {/* 초기 안내 */}
      {uploadedImageUrl === null && !isModelLoading && !isImageAnalyzing && !predictionResult && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-md">
          <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">사진을 업로드하거나 촬영하여 관상을 분석해보세요!</h2>
        </div>
      )}

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        *사진은 절대 어디에도 저장되지 않습니다.*
      </p>
    </div>
  );
}

export default App;
