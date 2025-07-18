// src/utils/modelUtils.js
import * as tmImage from '@teachablemachine/image';

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/AQniBgBqg/"; // 여기에 본인의 모델 URL을 넣어주세요!

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
    // 예측 결과를 클래스 이름과 확률로 가공하여 반환
    return prediction.map(p => ({
      className: p.className,
      probability: p.probability.toFixed(2) // 소수점 2자리까지
    }));
  } catch (error) {
    console.error("예측 중 오류 발생:", error);
    throw new Error("이미지 예측에 실패했습니다.");
  }
}