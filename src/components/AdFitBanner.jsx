import { useEffect, useRef } from 'react';

export default function AdFitBanner() {
  const adRef = useRef(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
    script.async = true;
    adRef.current?.appendChild(script);
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
