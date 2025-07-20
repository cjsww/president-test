import React, { useState, useEffect, useRef } from 'react';
import { loadModel, predict } from './utils/modelUtils'; // 모델 로드 및 예측 유틸리티 임포트
import WebcamCapture from './components/WebcamCapture'; // WebcamCapture 컴포넌트 임포트
import './index.css'; // Tailwind CSS를 위한 기본 임포트
import dosaimage from '/dosaimage.png'; // 도사 이미지 임포트 (경로 확인 필요)

// 다크 모드 테마 옵션 정의
const Theme = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

function App() {
  const [modelLoaded, setModelLoaded] = useState(false); // 모델 로드 완료 상태
  const [predictionResult, setPredictionResult] = useState(null); // 예측 결과 상태
  const [isModelLoading, setIsModelLoading] = useState(false); // 모델 로딩 중 상태
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false); // 이미지 분석 중 상태
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null); // 화면에 보여줄 이미지 URL 상태
  const [isWebcamMode, setIsWebcamMode] = useState(false); // 웹캠 모드 활성화 여부

  // 테마 상태 관리 (로컬 스토리지에서 로드 또는 시스템 기본값 사용)
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? Theme.DARK : Theme.LIGHT;
  });

  const imageRef = useRef(null); // 예측용 숨겨진 이미지 태그 참조

  // 컴포넌트 마운트 시 모델 로드
  useEffect(() => {
    const initModel = async () => {
      setIsModelLoading(true); // 모델 로딩 시작
      try {
        await loadModel(); // 모델 로드 함수 호출
        setModelLoaded(true); // 모델 로드 완료
      } catch (error) {
        // alert(`모델 로드 중 오류 발생: ${error.message}`); // alert 대신 다른 UI로 메시지 표시 권장
        console.error("모델 로드 중 오류 발생:", error);
      } finally {
        setIsModelLoading(false); // 로딩 완료 또는 오류 발생 시 로딩 상태 해제
      }
    };
    initModel();
  }, []);

  // 테마 변경 로직 (<html> 요소에 dark 클래스 추가/제거)
  useEffect(() => {
    const root = document.documentElement; // <html> 요소
    localStorage.setItem('theme', theme); // 로컬 스토리지에 테마 저장

    // 현재 테마 설정에 따라 dark 클래스 토글
    if (theme === Theme.DARK || (theme === Theme.SYSTEM && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 시스템 테마 변경 감지 리스너
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

    // 컴포넌트 언마운트 시 리스너 제거
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 테마 토글 함수
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === Theme.LIGHT) return Theme.DARK;
      if (prevTheme === Theme.DARK) return Theme.SYSTEM;
      return Theme.LIGHT; // SYSTEM -> LIGHT
    });
  };

  // 이미지 처리 및 예측을 위한 공통 함수
  const processImageForPrediction = async (imgDataUrl) => {
    setIsImageAnalyzing(true); // 이미지 분석 시작
    setPredictionResult(null); // 기존 예측 결과 초기화
    setUploadedImageUrl(null); // 화면 이미지 초기화 (분석 중 메시지 위함)

    const tempImgForPrediction = new Image();
    tempImgForPrediction.src = imgDataUrl;

    tempImgForPrediction.onload = async () => {
      // 이미지가 완전히 로드된 후에 예측 수행
      try {
        const results = await predict(tempImgForPrediction);
        setPredictionResult(results); // 예측 결과 저장
        setUploadedImageUrl(imgDataUrl); // 예측 완료 후 이미지 다시 표시
        console.log("전체 예측 결과:", results);
      } catch (error) {
        // alert(`이미지 예측 중 오류 발생: ${error.message}`); // alert 대신 다른 UI로 메시지 표시 권장
        console.error("이미지 예측 중 오류 발생:", error);
      } finally {
        setIsImageAnalyzing(false); // 분석 완료 또는 오류 발생 시 상태 해제
      }
    };
    tempImgForPrediction.onerror = (error) => {
      console.error("예측용 이미지 로드 중 오류 발생:", error);
      // alert("이미지를 로드할 수 없습니다. 유효한 이미지인지 확인해주세요."); // alert 대신 다른 UI로 메시지 표시 권장
      setIsImageAnalyzing(false); // 오류 발생 시 상태 해제
    };
  };

  // 파일 업로드 핸들러
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!modelLoaded) {
      // alert("모델이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요."); // alert 대신 다른 UI로 메시지 표시 권장
      console.warn("모델이 아직 로드되지 않았습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      processImageForPrediction(e.target.result); // 파일 읽기 완료 후 예측 함수 호출
    };
    reader.readAsDataURL(file); // 파일을 Data URL로 읽기
  };

  // 웹캠으로 사진 촬영 후 데이터 전달받는 핸들러
  const handleWebcamCapture = (imageSrc) => {
    setIsWebcamMode(false); // 웹캠 모드 종료
    processImageForPrediction(imageSrc); // 촬영된 이미지로 예측 시작
  };

  // 웹캠 모드 취소 핸들러
  const handleWebcamCancel = () => {
    setIsWebcamMode(false); // 웹캠 모드 종료
    setIsImageAnalyzing(false); // 웹캠 취소 시 이미지 분석 상태도 초기화
  };

  // 예측 결과 퍼센트에 따른 유머러스한 문구 반환 함수
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
        "😂 대통령상과는 거리가 멀지만, 당신은 분명 행복상입니다!",
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

  // 웹캠 모드일 경우 웹캠 컴포넌트만 렌더링
  if (isWebcamMode) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800 dark:text-gray-200 text-center">카메라 촬영</h1>
        <WebcamCapture onCapture={handleWebcamCapture} onCancel={handleWebcamCancel} />
      </div>
    );
  }

  // totalPresidentProbability 값을 안전하게 파싱하고 유효성 검사
  const presidentProb = predictionResult?.totalPresidentProbability ? parseFloat(predictionResult.totalPresidentProbability) : 0;
  const displayPresidentProb = isNaN(presidentProb) ? 'N/A' : Math.round(presidentProb * 100) + '%';
  const humorousMessage = isNaN(presidentProb) ? '예측 결과를 불러올 수 없습니다.' : getHumorousMessage(presidentProb);

  return (
    // 메인 컨테이너: 최소 높이, 배경색, flexbox 정렬, 반응형 패딩
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center justify-center p-2 sm:p-4">
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

      {/* 제목 */}
      <h1 className="text-3xl md:text-4xl font-bold mb-1 sm:mb-2 text-gray-800 dark:text-gray-200 text-center">대통령상 테스트</h1>
      {/* 부제목 */}
      <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-1 sm:mb-2 text-center">AI가 분석해주는 관상테스트</p>
      {/* 강조 문구 */}
      <p className="text-base md:text-lg text-red-600 font-bold mb-4 sm:mb-6 text-center">
        <span className="text-xl md:text-2xl font-extrabold">0.001%</span>의 사람만이 <span className="underline">대통령의 얼굴</span>을 가졌습니다.
      </p>

      {/* 도사 이미지 또는 모델 로딩 중 메시지 표시 */}
      {!predictionResult && (
        <div className="my-8 flex items-center justify-center w-40 h-40 md:w-48 md:h-48 rounded-full bg-white dark:bg-gray-800 shadow-lg border-4 border-gray-300 dark:border-gray-700">
          {!modelLoaded && isModelLoading ? (
            <p className="text-center text-gray-700 dark:text-gray-300 text-sm md:text-base animate-pulse">모델 로딩 중...</p>
          ) : (
            <img
              src={dosaimage}
              alt="도사 이미지"
              className="rounded-full w-full h-full object-cover"
            />
          )}
        </div>
      )}


      {/* 파일 업로드 및 카메라 촬영 버튼 그룹 */}
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
      )}

      {/* 이미지 분석 중 메시지 */}
      {isImageAnalyzing && (
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
        className="w-full h-auto max-h-[30vh] sm:max-h-[40vh] object-contain rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 mx-auto"
      />
        </div>
      )}

      {/* 예측 결과 표시 부분 */}
      {predictionResult && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>
          
          {/* 대통령 관상 총합 확률 */}
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
            <span className="font-semibold text-blue-700 dark:text-blue-300">대통령 관상: </span>{' '}
            <span className="text-blue-600 font-bold">{displayPresidentProb}</span>
          </p>
          
          {/* 유머러스한 문구 표시 (총합 확률 기반) */}
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-4 mb-6">
            {humorousMessage}
          </p>

          {/* 개별 대통령 클래스 예측 결과 (상위 3개) */}
          {predictionResult.presidentClasses && predictionResult.presidentClasses.length > 0 && (
            <div className="mt-6 text-left border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                {predictionResult.presidentClasses.length > 1 ? '가장 닮은 대통령 TOP 3:' : '가장 닮은 대통령:'}
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                {predictionResult.presidentClasses
                  .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability)) // 확률 높은 순으로 정렬
                  .slice(0, 3) // 상위 3개만 추출
                  .map((p, index) => (
                    <li key={index} className="mb-1">
                      {p.className.replace('대통령_', '')}: <span className="font-bold">{Math.round(parseFloat(p.probability) * 100)}%</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* 개별 유명인 클래스 예측 결과 (상위 3개) */}
          {predictionResult.celebrityClasses && predictionResult.celebrityClasses.length > 0 && (
            <div className="mt-4 text-left border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">관련 유명인상 (Top 3)</h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                {predictionResult.celebrityClasses
                  .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability)) // 확률 높은 순으로 정렬
                  .slice(0, 3) // 상위 3개만 추출
                  .map((p, index) => (
                    <li key={index} className="mb-1">
                      {p.className.replace('유명인_', '')}: <span className="font-bold">{Math.round(parseFloat(p.probability) * 100)}%</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* 다시 시도 버튼 */}
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
      {uploadedImageUrl && !isImageAnalyzing && !predictionResult?.totalPresidentProbability && (
          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
              업로드된 사진에서 대통령 관상을 찾을 수 없습니다.
            </p>
            {/* 모든 클래스 결과 (옵션) - 이 부분은 필요하다면 제거하거나 수정할 수 있습니다. */}
            {predictionResult?.allPredictions && predictionResult.allPredictions.length > 0 && (
              <div className="mt-4 text-left border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">모든 클래스 확률:</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
                  {predictionResult.allPredictions
                    .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability)) // 확률 높은 순으로 정렬
                    .map((p, index) => (
                      <li key={index} className="mb-1">
                        {p.className}: <span className="font-bold">{Math.round(parseFloat(p.probability) * 100)}%</span>
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
      {/* 예측 결과가 아직 없고, 로딩 중도 아니며, 이미지도 업로드되지 않은 초기 상태 */}
      {uploadedImageUrl === null && !isModelLoading && !isImageAnalyzing && !predictionResult && (
        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">사진을 업로드하거나 촬영하여 관상을 분석해보세요!</h2>
        </div>
      )}

      {/* 개인정보 보호 문구 */}
      <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
        *사진은 절대 어디에도 저장되지 않습니다.*
      </p>
    </div>
  );
}

export default App;
