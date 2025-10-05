import { Check, X, AlertCircle, Star } from "lucide-react";

const ComparisonTable = () => {
  const competitors = [
    { name: "Aspirely.ai", highlight: true },
    { name: "LinkedIn", highlight: false },
    { name: "Indeed", highlight: false },
    { name: "Huntr", highlight: false },
    { name: "ChatGPT", highlight: false },
  ];

  const features = [
    {
      name: "Job Discovery",
      values: [
        { type: "check", text: "AI-matched daily alerts" },
        { type: "x", text: "Manual search" },
        { type: "x", text: "Manual search" },
        { type: "x", text: "" },
        { type: "x", text: "" },
      ],
    },
    {
      name: "Application Files",
      values: [
        { type: "check", text: "Tailored to each specific job instantly" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "warning", text: "Generic templates" },
      ],
    },
    {
      name: "Application Tracking",
      values: [
        { type: "check", text: "Auto-synced from Telegram" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "check", text: "Manual entry" },
        { type: "x", text: "" },
      ],
    },
    {
      name: "Interview Practice",
      values: [
        { type: "check", text: "Real AI phone calls" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "warning", text: "Text chat only" },
      ],
    },
    {
      name: "Fresh Jobs Only",
      values: [
        { type: "check", text: "<24 hours old" },
        { type: "x", text: "Stale" },
        { type: "x", text: "Stale" },
        { type: "text", text: "N/A" },
        { type: "text", text: "N/A" },
      ],
    },
    {
      name: "Intelligent Profile System",
      special: true,
      values: [
        { type: "check", text: "Remembers & adapts—update once, everything improves" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "x", text: "" },
        { type: "x", text: "" },
      ],
    },
  ];

  const renderIcon = (type: string) => {
    switch (type) {
      case "check":
        return <Check className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case "x":
        return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16">
      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-left font-semibold text-gray-900 dark:text-white text-sm">
                  Feature
                </th>
                {competitors.map((competitor) => (
                  <th
                    key={competitor.name}
                    className={`px-6 py-4 text-center font-semibold text-sm ${
                      competitor.highlight
                        ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr
                  key={feature.name}
                  className={`border-b border-gray-200 dark:border-gray-700 ${
                    feature.special ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white text-sm">
                    {feature.special && <Star className="inline-block w-4 h-4 text-yellow-500 mr-2" />}
                    {feature.name}
                  </td>
                  {feature.values.map((value, valueIdx) => (
                    <td
                      key={valueIdx}
                      className={`px-6 py-4 text-center ${
                        competitors[valueIdx].highlight
                          ? "bg-cyan-50 dark:bg-cyan-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {renderIcon(value.type)}
                        {value.text && (
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {value.text}
                          </span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-6">
        {competitors.map((competitor, compIdx) => (
          <div
            key={competitor.name}
            className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border ${
              competitor.highlight
                ? "border-cyan-500 dark:border-cyan-400"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <h3
              className={`text-lg font-bold mb-4 ${
                competitor.highlight
                  ? "text-cyan-900 dark:text-cyan-100"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {competitor.name}
            </h3>
            <div className="space-y-4">
              {features.map((feature, featIdx) => (
                <div
                  key={feature.name}
                  className={`pb-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                    feature.special ? "bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-sm text-gray-900 dark:text-white flex items-center gap-2">
                      {feature.special && (
                        <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      <span>{feature.name}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {renderIcon(feature.values[compIdx].type)}
                      {feature.values[compIdx].text && (
                        <span className="text-xs text-gray-600 dark:text-gray-400 text-right">
                          {feature.values[compIdx].text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Differentiator Callout */}
      <div className="mt-8 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-cyan-200 dark:border-cyan-800 shadow-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            <strong className="font-semibold text-gray-900 dark:text-white">
              Aspirely.ai is the only platform where your AI agents share one evolving profile.
            </strong>{" "}
            Add a new skill once, and your job matches, resumes, cover letters, and interview prep
            automatically improve everywhere. No other platform connects their features this way.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
