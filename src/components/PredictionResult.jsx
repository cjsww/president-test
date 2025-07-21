import React from 'react';

const PredictionResult = ({
  displayPresidentProb,
  humorousMessage,
  presidentClasses,
  celebrityClasses,
  onRetry,
}) => (
  <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl text-center w-full max-w-xs sm:max-w-sm md:max-w-md">
    <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-800 dark:text-gray-200">예측 결과</h2>

    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-2">
      <span className="font-semibold text-blue-700 dark:text-blue-300">대통령 관상: </span>
      <span className="text-blue-600 font-bold">{displayPresidentProb}</span>
    </p>

    <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-4 mb-6">
      {humorousMessage}
    </p>

    {/* 대통령 TOP 3 */}
    {presidentClasses?.length > 0 && (
      <div className="mt-6 text-left border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
          {presidentClasses.length > 1 ? '가장 닮은 대통령 TOP 3:' : '가장 닮은 대통령:'}
        </h3>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
          {presidentClasses
            .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
            .slice(0, 3)
            .map((p, i) => (
              <li key={i}>
                {p.className.replace('대통령_', '')}: <strong>{Math.round(p.probability * 100)}%</strong>
              </li>
            ))}
        </ul>
      </div>
    )}

    {/* 유명인 TOP 3 */}
    {celebrityClasses?.length > 0 && (
      <div className="mt-4 text-left border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">관련 유명인상 (Top 3)</h3>
        <ul className="list-disc list-inside text-gray-600 dark:text-gray-400">
          {celebrityClasses
            .sort((a, b) => parseFloat(b.probability) - parseFloat(a.probability))
            .slice(0, 3)
            .map((p, i) => (
              <li key={i}>
                {p.className.replace('유명인_', '')}: <strong>{Math.round(p.probability * 100)}%</strong>
              </li>
            ))}
        </ul>
      </div>
    )}

    <button
      onClick={onRetry}
      className="mt-6 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md w-full max-w-xs mx-auto"
    >
      다시 시도
    </button>
  </div>
);

export default PredictionResult;
