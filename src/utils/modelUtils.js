// src/utils/modelUtils.js
import * as tmImage from '@teachablemachine/image';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/dA_XwNxfT/"; // 여기에 본인의 모델 URL을 넣어주세요!

let model;
let maxPredictions;

export async function loadModel() {
  if (model) return; // 이미 로드된 경우 다시 로드하지 않음
  try {
    model = await tmImage.load(
      MODEL_URL + "model.json",
      MODEL_URL + "metadata.json"
    );
    maxPredictions = model.getTotalClasses();
    console.log("Teachable Machine 모델 로드 완료!");
  } catch (error) {
    console.error("모델 로드 중 오류 발생:", error);
    throw new Error("모델을 로드할 수 없습니다. URL을 확인해 주세요.");
  }
}

export async function predict(imageElement) {
  if (!model) {
    throw new Error("모델이 아직 로드되지 않았습니다. loadModel()을 먼저 호출해주세요.");
  }
  try {
    const prediction = await model.predict(imageElement);

    // 클래스명 배열 (순서 중요, "이재명"부터 위까지가 대통령)
    const presidentNames = [
      "이승만", "윤보선", "박정희", "최규하", "전두환", "노태우", "김영삼",
      "노무현", "이명박", "문재인", "윤석열", "이재명"
    ];

    // 대통령 클래스 확률 합계 계산
    let totalPresidentProbability = 0;
    const presidentClasses = [];

    prediction.forEach(p => {
      if (presidentNames.includes(p.className)) {
        totalPresidentProbability += parseFloat(p.probability);
        presidentClasses.push({
          className: p.className,
          probability: p.probability
        });
      }
    });

    // 전체 결과 반환 (기존 클래스별 확률도 포함)
    return {
      totalPresidentProbability: totalPresidentProbability.toFixed(2),
      presidentClasses,
      allClasses: prediction.map(p => ({
        className: p.className,
        probability: p.probability
      }))
    };
  } catch (error) {
    console.error("예측 중 오류 발생:", error);
    throw new Error("이미지 예측에 실패했습니다.");
  }
}