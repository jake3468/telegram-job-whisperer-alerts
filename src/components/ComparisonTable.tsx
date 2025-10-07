import { Check, X, AlertCircle, Star } from "lucide-react";
import { useEffect, useRef } from "react";

const ComparisonTable = () => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-20px 0px -50px 0px',
      threshold: 0.3
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !entry.target.classList.contains('animate-in')) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    if (headingRef.current) {
      observer.observe(headingRef.current);
    }

    return () => {
      if (headingRef.current) {
        observer.unobserve(headingRef.current);
      }
    };
  }, []);
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
      name: "Intelligent\nProfile System",
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
    <div className="w-full max-w-7xl mx-auto px-4 py-12">
      {/* Section Heading */}
      <div className="text-center mb-8">
        <h2 ref={headingRef} className="animate-on-scroll text-3xl md:text-4xl font-bold text-foreground mb-2 font-inter">
          See the Difference: Aspirely vs. Others
        </h2>
      </div>
      {/* Horizontally Scrollable Table for All Devices */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden border border-gray-300 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-600">
                <th className="pl-3 pr-2 py-3 text-left font-bold text-gray-950 dark:text-white text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 w-32 md:w-40">
                  Feature
                </th>
                {competitors.map((competitor, idx) => (
                  <th
                    key={competitor.name}
                    className={`px-4 py-3 text-center font-bold text-xs md:text-sm whitespace-nowrap ${
                      idx < competitors.length - 1 ? "border-r border-gray-300 dark:border-gray-600" : ""
                    } ${
                      competitor.highlight
                        ? "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-950 dark:text-cyan-100"
                        : "text-gray-950 dark:text-white"
                    }`}
                  >
                    {competitor.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, featIdx) => (
                <tr
                  key={feature.name}
                  className={`border-b border-gray-300 dark:border-gray-600 ${
                    feature.special ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                  }`}
                >
                  <td className="pl-3 pr-2 py-3 font-semibold text-gray-950 dark:text-white text-xs md:text-sm border-r border-gray-300 dark:border-gray-600 sticky left-0 bg-white dark:bg-gray-900 z-10 w-32 md:w-40">
                    {feature.special && <Star className="inline-block w-3 h-3 md:w-4 md:h-4 text-yellow-500 mr-1" />}
                    <span className="whitespace-pre-line">{feature.name}</span>
                  </td>
                  {feature.values.map((value, valueIdx) => (
                    <td
                      key={valueIdx}
                      className={`px-4 py-3 text-center ${
                        valueIdx < feature.values.length - 1 ? "border-r border-gray-300 dark:border-gray-600" : ""
                      } ${
                        competitors[valueIdx].highlight
                          ? "bg-cyan-50 dark:bg-cyan-900/20"
                          : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {renderIcon(value.type)}
                        {value.text && (
                          <span className="text-[10px] md:text-xs text-gray-800 dark:text-gray-300 leading-tight max-w-[120px] md:max-w-[150px] font-medium">
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
        
        {/* Scroll indicator for mobile */}
        <div className="lg:hidden text-center py-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-gray-600">
          ← Scroll to see more →
        </div>
      </div>

    </div>
  );
};

export default ComparisonTable;
