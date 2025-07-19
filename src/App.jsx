// src/App.jsx
import React, { useState, useEffect, useRef } from 'react';
import { loadModel, predict } from './utils/modelUtils';
import WebcamCapture from './components/WebcamCapture'; // WebcamCapture 컴포넌트 임포트
import './index.css'; // Tailwind CSS를 위한 기본 임포트
import dosaimage from './assets/dosaimage.png'; // 도사 이미지 임포트

// 다크 모드 테마 옵션
const Theme = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

function App() {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // 화면에 보여줄 이미지 URL 상태
  const [isWebcamMode, setIsWebcamMode] = useState(false); // 웹캠 모드 활성화 여부
  const [theme, setTheme] = useState(() => {
    // 로컬 스토리지에서 저장된 테마를 로드하거나 시스템 기본값 사용
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  });

  const imageRef = useRef(null); // 사용되지 않지만 코드에서 유지

  // 컴포넌트 마운트 시 모델 로드
  useEffect(() => {
    const initModel = async () => {
      setLoading(true); // 모델 로딩 시작 시 로딩 상태 true
      try {
        await loadModel();
        setModelLoaded(true); // 모델 로드 완료 시 modelLoaded true
      } catch (error) {
        alert(`모델 로드 중 오류 발생: ${error.message}`);
      } finally {
        setLoading(false); // 로딩 완료 또는 오류 발생 시 로딩 상태 false
      }
    };
    initModel();
  }, []);

  // 테마 변경 로직 (기존과 동일)
  useEffect(() => {
    const root = document.documentElement; // <html> 요소
    localStorage.setItem('theme', theme); // 로컬 스토리지에 테마 저장

    if (theme === Theme.DARK || (theme === Theme.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (theme === Theme.SYSTEM) {
        if (e.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 테마 토글 함수 (기존과 동일)
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === Theme.LIGHT) return Theme.DARK;
      if (prevTheme === Theme.DARK) return Theme.SYSTEM;
      return Theme.LIGHT; // SYSTEM -> LIGHT
    });
  };

  // 이미지 처리 및 예측을 위한 공통 함수
  const processImageForPrediction = async (imgDataUrl) => {
    setLoading(true);
    setPredictionResult(null); // 새로운 예측 시 기존 결과 초기화
    setUploadedImageUrl(null); // 새로운 예측 시 화면 이미지 초기화 (분석 중 메시지 위함)

    const tempImgForPrediction = new Image();
    tempImgForPrediction.src = imgDataUrl;

    tempImgForPrediction.onload = async () => {
      try {
        const results = await predict(tempImgForPrediction);
        setPredictionResult(results); // { totalPresidentProbability, presidentClasses, allClasses }
        setUploadedImageUrl(imgDataUrl); // 예측이 완료되면 이미지를 다시 표시
        console.log("전체 예측 결과:", results);
      } catch (error) {
        alert(`이미지 예측 중 오류 발생: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    tempImgForPrediction.onerror = (error) => {
      console.error("예측용 이미지 로드 중 오류 발생:", error);
      alert("이미지를 로드할 수 없습니다. 유효한 이미지인지 확인해주세요.");
      setLoading(false);
    };
  };

  // 파일 업로드 핸들러 (기존과 동일)
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!modelLoaded) {
      alert("모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      processImageForPrediction(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // 웹캠으로 사진 촬영 후 데이터 전달받는 핸들러 (기존과 동일)
  const handleWebcamCapture = (imageSrc) => {
    setIsWebcamMode(false); // 웹캠 모드 종료
    processImageForPrediction(imageSrc); // 촬영된 이미지로 예측 시작
  };

  // 웹캠 모드 취소 핸들러 (기존과 동일)
  const handleWebcamCancel = () => {
    setIsWebcamMode(false); // 웹캠 모드 종료
    setLoading(false); // 로딩 상태 초기화
  };

  // 예측 결과 퍼센트에 따른 유머러스한 문구 반환 함수 (기존과 동일)
  const getHumorousMessage = (probability) => {
    const percentage = Math.round(probability * 100);

    const messages = {
      '95+': [
        "🎉 맙소사! 당신은 이미 대통령이십니다! 어서 나라를 구해주세요!",
        "👑 이 정도면 관상이 아니라 운명입니다!",
        "✨ 빛이 나는군요! 당신의 얼굴에서 국운이 느껴집니다. 취임 준비하세요!"
      ],
      '90-94': [
        "✨ 대통령의 기운이 뿜어져 나옵니다! 곧 청와대에서 뵙겠군요!",
        "🌟 범상치 않은 아우라! 당신은 분명 큰 인물이 될 상입니다.",
        "💖 와우! 대통령의 DNA가 흐르는군요. 국민들이 당신을 기다립니다!"
      ],
      '80-89': [
        "🌟 거의 대통령급 관상이네요! 주변 사람들에게 덕망이 두터울 상입니다.",
        "👍 당신의 얼굴엔 숨겨진 위엄이 있습니다. 리더의 상이 확실하군요!",
        "🤩 훌륭한 리더의 얼굴입니다. 축하드립니다!"
      ],
      '70-79': [
        "👍 국무총리는 가능할지도?",
        "😊 꽤 높은 확률! 당신의 얼굴엔 숨겨진 위엄이 있군요.",
        "🤔 관상 전문가도 놀랄 만한 결과! 당신은 특별합니다."
      ],
      '60-69': [
        "😊 꽤 높은 확률! 당신의 얼굴엔 숨겨진 위엄이 있군요.",
        "😅 장관까진 가능할지도?",
        "💡 잠재력 폭발! 당신의 미래는 밝습니다. 힘내세요!"
      ],
      '50-59': [
        "🤔 음... 반은 왔습니다. 잠재력을 키워보세요!",
        "😅 적당한 운은 타고났네요.",
        "😅 아직은 좀 더 갈고닦아야 할 관상이지만, 노력하면 빛을 볼 겁니다!"
      ],
      '40-49': [
        "😅 대통령이 아니어도 괜찮아! 당신은 당신만의 매력이 있습니다.",
        "😂 대통령과는 거리가 좀 있지만, 당신만의 특별함이 빛나는군요!",
        "👀 관상보다는 인성이 중요하죠! 당신은 좋은 사람입니다."
      ],
      '30-39': [
        "😂 대통령과는 거리가 좀 있지만, 당신만의 특별함이 빛나는군요!",
        "👀 걱정 마세요! 대통령은 아무나 하는 게 아니죠. 당신은 당신만의 매력이 있습니다!",
        "🤷‍♀️ 관상 점수는 몰라도, 당신의 행복 지수는 높을 겁니다! (아마도?)"
      ],
      '10-29': [
        "👀 걱정 마세요! 대통령은 아무나 하는 게 아니죠. 당신은 당신만의 매력이 있습니다!",
        "😂 0%에 가깝다고요? 오히려 좋아! 당신은 자유로운 영혼의 소유자입니다!",
        "🤷‍♀️ 이 정도면 관상보다는 개성이 강한 얼굴입니다. 독특함 최고!"
      ],
      '0-9': [
        "😂 0%에 가깝다고요? 오히려 좋아! 당신은 자유로운 영혼의 소유자입니다!",
        "🤣 대통령상과는 거리가 멀지만, 당신은 분명 행복상입니다!",
        "🤔 음... 혹시 지나가던 파리가 찍힌게 아닐까요? 다시 한번 도전!"
      ]
    };

    let selectedMessages;
    if (percentage >= 95) {
      selectedMessages = messages['95+'];
    } else if (percentage >= 90) {
      selectedMessages = messages['90-94'];
    } else if (percentage >= 80) {
      selectedMessages = messages['80-89'];
    } else if (percentage >= 70) {
      selectedMessages = messages['70-79'];
    } else if (percentage >= 60) {
      selectedMessages = messages['60-69'];
    } else if (percentage >= 50) {
      selectedMessages = messages['50-59'];
    } else if (percentage >= 40) {
      selectedMessages = messages['40-49'];
    } else if (percentage >= 30) {
      selectedMessages = messages['30-39'];
    } else if (percentage >= 10) {
      selectedMessages = messages['10-29'];
    } else {
      selectedMessages = messages['0-9'];
    }

    const randomIndex = Math.floor(Math.random() * selectedMessages.length);
    return selectedMessages[randomIndex];
  };

  // 웹캠 모드일 경우 웹캠 컴포넌트만 렌더링 (기존과 동일)
  if (isWebcamMode) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800 dark:text-gray-200 text-center">카메라 촬영</h1>
        <WebcamCapture onCapture={handleWebcamCapture} onCancel={handleWebcamCancel} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      {/* 테마 토글 버튼 */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md transition-colors duration-300"
        title="테마 변경"
      >
        {theme === Theme.LIGHT && '☀️'}
        {theme === Theme.DARK && '🌙'}
        {theme === Theme.SYSTEM && '💻'}
      </button>

      <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200 text-center">대통령상 테스트</h1>
      <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-2 text-center">AI가 분석해주는 관상테스트</p>
      <p className="text-base md:text-lg text-red-600 font-bold mb-6 text-center">
        <span className="text-xl md:text-2xl font-extrabold">0.001%</span>의 사람만이 <span className="underline">대통령의 얼굴</span>을 가졌습니다.
      </p>

      {/* 도사 이미지 또는 모델 로딩 중 메시지 표시 */}
      <div className="my-8 flex items-center justify-center w-40 h-40 md:w-48 md:h-48 rounded-full bg-white dark:bg-gray-800 shadow-lg border-4 border-gray-300 dark:border-gray-700">
        {!modelLoaded ? ( // 모델이 로드되지 않았을 때
          <p className="text-center text-gray-700 dark:text-gray-300 text-sm md:text-base animate-pulse">모델 로딩 중...</p>
        ) : ( // 모델 로드 완료 시
          <img
            src={dosaimage} // 도사 이미지 사용
            alt="도사 이미지"
            className="rounded-full w-full h-full object-cover" // 부모 div에 꽉 차도록
          />
        )}
      </div>

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
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg cursor-pointer transition duration-300 ease-in-out text-lg shadow-md text-center"
        >
          사진 업로드
        </label>
        <button
          onClick={() => setIsWebcamMode(true)}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg transition duration-300 ease-in-out text-lg shadow-md"
        >
          카메라 촬영
        </button>
      </div>

      {loading && (
        <p className="text-lg text-gray-600 dark:text-gray-400 mt-4 animate-pulse text-center w-full">사진 분석 중...</p>
      )}

      {/* 예측용 숨겨진 이미지 태그 (현재 로직에서는 직접 사용되지 않음) */}
      <img ref={imageRef} alt="Hidden for prediction" style={{ display: 'none' }} />

      {/* 업로드/촬영된 이미지를 보여주는 부분 */}
      {uploadedImageUrl && (
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-center">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">업로드된 사진</h2>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="max-w-full h-auto rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 mx-auto"
          />
        </div>
      )}

      {/* 예측 결과 표시 부분 (총합 확률과 탑 3 대통령 관상) */}
      {predictionResult && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>

          {/* 대통령 관상 총합 확률 */}
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">대통령 관상: </span>{' '}
            <span className="text-blue-600 font-bold">{Math.round(parseFloat(predictionResult.totalPresidentProbability) * 100)}%</span>
          </p>
          {/* 유머러스한 문구 표시 (총합 확률 기반) */}
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-4 mb-6">
            {getHumorousMessage(parseFloat(predictionResult.totalPresidentProbability))}
          </p>

          {/* 탑 3 대통령별 상세 확률 표시 */}
          {predictionResult.presidentClasses && predictionResult.presidentClasses.length > 0 && (
            <div className="mt-6 text-left">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {predictionResult.presidentClasses.length > 1 ? '가장 닮은 대통령 TOP 3:' : '가장 닮은 대통령:'}
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                {predictionResult.presidentClasses
                  .sort((a, b) => b.probability - a.probability) // 확률 높은 순으로 정렬
                  .slice(0, 3) // 상위 3개만 추출
                  .map((p, index) => (
                    <li key={index} className="mb-1">
                      {p.className}: <span className="font-bold">{Math.round(p.probability * 100)}%</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

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

      {/* 예측 결과가 없는데 이미지는 업로드 된 경우 (예: '대통령' 클래스가 아닌 다른 클래스로 분류될 경우) */}
      {uploadedImageUrl && !loading && !predictionResult?.totalPresidentProbability && (
          <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
              업로드된 사진에서 대통령 관상을 찾을 수 없습니다.
            </p>
            {/* 모든 클래스 결과 (옵션) - 이 부분은 필요하다면 제거하거나 수정할 수 있습니다. */}
            {predictionResult?.allClasses && predictionResult.allClasses.length > 0 && (
              <div className="mt-4 text-left">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">모든 클래스 확률:</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                  {predictionResult.allClasses
                    .sort((a, b) => b.probability - a.probability) // 확률 높은 순으로 정렬
                    .map((p, index) => (
                      <li key={index} className="mb-1">
                        {p.className}: <span className="font-bold">{Math.round(p.probability * 100)}%</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
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

      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        *사진은 절대 어디에도 저장되지 않습니다.*
      </p>
    </div>
  );
}

export default App;