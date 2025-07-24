import { useEffect, useRef } from 'react';

function loadKakaoScriptOnce() {
  if (!window.__kakaoAdfitScriptLoaded) {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.async = true;
    document.body.appendChild(script);
    window.__kakaoAdfitScriptLoaded = true;
  }
}

export function AdFitVerticalBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    loadKakaoScriptOnce();
  }, []);

  return (
    <div ref={adRef}>
      <ins className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit="DAN-yU4g8s31ypPYMXgG"
        data-ad-width="160"
        data-ad-height="600"
      ></ins>
    </div>
  );
}

export function AdFitHorizontalBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    loadKakaoScriptOnce();
  }, []);

  return (
    <div ref={adRef}>
      <ins className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit="DAN-jzcWyqu9HYdDBQwV"
        data-ad-width="728"
        data-ad-height="90"
      ></ins>
    </div>
  );
}

export function AdFitMobileBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    loadKakaoScriptOnce();
  }, []);

  return (
    <div ref={adRef}>
      <ins className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit="DAN-vXZl5o1vD0oJbsai"
        data-ad-width="320"
        data-ad-height="50"
      ></ins>
    </div>
  );
}
