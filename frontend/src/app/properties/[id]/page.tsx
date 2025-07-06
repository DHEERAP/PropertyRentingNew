"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getProperty, aiPropertyEvaluation } from "../../../lib/api";

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";

export default function PropertyDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProperty = async () => {
      try {
        const res = await getProperty(id);
        setProperty(res.data);
      } catch {
        setProperty(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  const handleAIEvaluate = async () => {
    setAiLoading(true);
    setAiResult(null);
    setAiError(null);
    try {
      const res = await aiPropertyEvaluation({
        price: property.price,
        areaSqFt: property.areaSqFt || property.area,
        city: property.city || property.location,
        state: property.state,
        type: property.type,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        amenities: property.amenities,
        description: property.description,
      });
      const data = res.data as { result: string };
      setAiResult(data.result);
    } catch (err: any) {
      setAiError(err?.response?.data?.message || "AI evaluation failed");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="mt-12 text-center text-gray-500">Loading...</div>;
  if (!property) return <div className="mt-12 text-center text-gray-500">Property not found.</div>;

  return (
    <div className="max-w-4xl mx-auto mt-12 bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-200">
      {/* Image */}
      <div className="h-80 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
        <img
          src={property.imageUrl || PLACEHOLDER_IMAGE}
          alt={property.title || property.name}
          className="object-cover w-full h-full"
        />  
      </div>
      {/* Details */}
      <div className="p-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-2 md:mb-0 drop-shadow-sm tracking-tight">
            {property.title || property.name}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {property.isVerified && (
              <span className="bg-green-200 text-green-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">Verified</span>
            )}
            <span className="bg-purple-200 text-purple-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              {property.listingType}
            </span>
            {property.rating && (
              <span className="bg-yellow-200 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
                ★ {property.rating}
              </span>
            )}
          </div>
        </div>
        <div className="text-gray-700 mb-2 text-lg font-semibold flex items-center gap-2">
          <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold">{property.city || property.location}, {property.state || ""}</span>
        </div>
        <div className="text-blue-800 font-extrabold text-4xl mb-8 drop-shadow bg-blue-50 px-6 py-3 rounded-lg border border-blue-200 inline-block">
          ₹{property.price?.toLocaleString()}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-gray-50 rounded-xl p-8 border border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2">Property Features</h2>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Type:</span> <span className="text-black">{property.type}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Bedrooms:</span> <span className="text-black">{property.bedrooms}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Bathrooms:</span> <span className="text-black">{property.bathrooms}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Area:</span> <span className="text-black">{property.areaSqFt || property.area} sq.ft.</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Furnished:</span> <span className="text-black">{property.furnished}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Available From:</span> <span className="text-black">{property.availableFrom ? new Date(property.availableFrom).toLocaleDateString() : "-"}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Listed By:</span> <span className="text-black">{property.listedBy}</span></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2">Additional Details</h2>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Amenities:</span> <span className="text-black font-normal">{Array.isArray(property.amenities) ? property.amenities.join(", ") : property.amenities}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Tags:</span> <span className="text-black font-normal">{Array.isArray(property.tags) ? property.tags.join(", ") : property.tags}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Color Theme:</span> <span className="text-black font-normal">{property.colorTheme}</span></div>
            <div className="mb-3 text-lg font-medium text-black"><span className="font-bold text-black">Description:</span> <span className="text-black font-normal">{property.description || "No description provided."}</span></div>
          </div>
        </div>
      
        {/* AI Buy it or not section */}
        <div className="mt-10">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">AI Market Analysis</h2>
            <p className="text-gray-600">Get comprehensive market insights and investment recommendations</p>
          </div>
          
          <button
            onClick={handleAIEvaluate}
            className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-lg hover:from-green-600 hover:to-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed mb-4"
            disabled={aiLoading}
          >
            {aiLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing Market Data...
              </div>
            ) : (
              "Get AI Market Analysis"
            )}
          </button>
          
          {aiLoading && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-center text-blue-700">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="font-semibold">Analyzing property with AI...</p>
                <p className="text-sm text-blue-600 mt-1">Gathering market data, comparing amenities, and generating insights</p>
              </div>
            </div>
          )}
          
          {aiResult && (
            <div className="mt-6 bg-gradient-to-br from-blue-50 to-green-50 border border-blue-300 rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI Market Analysis Results
                </h3>
                <p className="text-blue-100 text-sm mt-1">Comprehensive real estate market insights powered by AI</p>
              </div>
              
              <div className="p-6">
                <div className="prose prose-lg max-w-none">
                  {aiResult.split('\n').map((line, index) => {
                    // Check if line is a section header (starts with ** or contains specific keywords)
                    const isHeader = line.trim().startsWith('**') || 
                                   line.trim().match(/^(Price Analysis|Amenities Value|Location Assessment|Investment Potential|Risk Factors|Recommendation|Market Trends|Amenities Impact):/i);
                    
                    // Check if line contains recommendation keywords
                    const hasRecommendation = line.toLowerCase().includes('buy') || 
                                            line.toLowerCase().includes('hold') || 
                                            line.toLowerCase().includes('avoid') ||
                                            line.toLowerCase().includes('recommend');
                    
                    if (isHeader) {
                      return (
                        <div key={index} className="mt-6 mb-3">
                          <h4 className="text-lg font-bold text-blue-900 bg-blue-100 px-3 py-2 rounded-lg border-l-4 border-blue-500">
                            {line.replace(/\*\*/g, '').trim()}
                          </h4>
                        </div>
                      );
                    } else if (hasRecommendation && line.trim()) {
                      return (
                        <div key={index} className="my-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 font-semibold">{line}</p>
                        </div>
                      );
                    } else if (line.trim()) {
                      return (
                        <p key={index} className="text-gray-700 leading-relaxed mb-2">
                          {line}
                        </p>
                      );
                    } else {
                      return <div key={index} className="h-2"></div>;
                    }
                  })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <span className="text-blue-500">📊</span>
                    <span>Analysis based on real market data from {property.city || property.location}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {aiError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-red-500">⚠️</span>
                <span className="font-semibold">Analysis Error:</span>
                <span>{aiError}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 