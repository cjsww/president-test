import React, { useEffect } from 'react';

function NativeAd() {
  useEffect(() => {
    // 스크립트 한 번만 삽입
    const script = document.createElement('script');
    script.src = "//pl27223307.profitableratecpm.com/7bfc07e51ff3651d406b569840aefe7e/invoke.js";
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div id="container-7bfc07e51ff3651d406b569840aefe7e" style={{ marginTop: '2rem', textAlign: 'center' }}>
      {/* 광고가 여기 표시됩니다 */}
    </div>
  );
}

export default NativeAd;
