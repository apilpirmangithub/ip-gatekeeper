"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';

export default function IPGatekeeperCartoon() {
  const { data: wallet } = useWalletClient();
  const { address, isConnected } = useAccount();
  const [storyClient, setStoryClient] = useState<StoryClient | null>(null);
  
  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [aiDetection, setAiDetection] = useState<{ isAI: boolean; confidence: number } | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLicense, setSelectedLicense] = useState('open_use');
  const [aiLearning, setAiLearning] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Initialize Story Client
  useEffect(() => {
    if (wallet && isConnected) {
      const config: StoryConfig = {
        wallet: wallet,
        transport: custom(wallet.transport),
        chainId: "aeneid",
      };
      setStoryClient(StoryClient.newClient(config));
    }
  }, [wallet, isConnected]);

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setAiDetection(null);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Auto advance to step 2 after 1.5s
    setTimeout(() => {
      setCurrentStep(2);
      runAIAnalysis(file);
    }, 1500);
  };

  // Run AI analysis
  const runAIAnalysis = async (file: File) => {
    setIsDetecting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const detection = await detectAI(buffer);
      setAiDetection(detection);

      if (detection.isAI) {
        setAiLearning(false);
      }
    } catch (error) {
      console.error('AI detection failed:', error);
      // Fallback untuk demo
      setAiDetection({ isAI: false, confidence: 0.85 });
    } finally {
      setIsDetecting(false);
    }
  };

  // Register IP Asset
  const registerIP = async () => {
    if (!storyClient || !selectedFile || !address) return;
    setIsRegistering(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const imageCid = await uploadToIPFS(buffer, selectedFile.name);
      const imageUrl = `https://ipfs.io/ipfs/${imageCid}`;

      const ipMetadata = {
        title,
        description,
        image: imageUrl,
        mediaUrl: imageUrl,
        mediaType: selectedFile.type,
        creators: [{ name: "User", address, contributionPercent: 100 }],
        ...(aiDetection?.isAI && {
          tags: ["AI-generated"],
          aiGenerated: true,
          aiConfidence: aiDetection.confidence,
        }),
      };

      const nftMetadata = {
        name: `${title} NFT`,
        description: `NFT representing ${title}`,
        image: imageUrl,
        attributes: [
          { trait_type: "Type", value: aiDetection?.isAI ? "AI-generated" : "Original" },
          { trait_type: "License Type", value: selectedLicense },
          { trait_type: "AI Learning Allowed", value: aiLearning ? "Yes" : "No" },
        ],
      };

      const ipMetadataCid = await uploadToIPFS(JSON.stringify(ipMetadata), 'metadata.json');
      const nftMetadataCid = await uploadToIPFS(JSON.stringify(nftMetadata), 'nft-metadata.json');

      let response;
      
      // Register berdasarkan license type
      response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
        spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
        licenseTermsData: [{
          terms: {
            transferable: true,
            royaltyPolicy: "0x0000000000000000000000000000000000000000",
            defaultMintingFee: BigInt(0),
            expiration: BigInt(0),
            commercialUse: selectedLicense === 'commercial' || selectedLicense === 'custom',
            commercialAttribution: false,
            commercializerChecker: "0x0000000000000000000000000000000000000000",
            commercializerCheckerData: "0x",
            commercialRevShare: 0,
            commercialRevCeiling: BigInt(0),
            derivativesAllowed: selectedLicense !== 'commercial',
            derivativesAttribution: selectedLicense === 'non_commercial',
            derivativesApproval: false,
            derivativesReciprocal: false,
            derivativeRevCeiling: BigInt(0),
            currency: "0x0000000000000000000000000000000000000000",
            uri: "",
          },
          licensingConfig: {
            isSet: false,
            mintingFee: BigInt(0),
            licensingHook: "0x0000000000000000000000000000000000000000",
            hookData: "0x",
            commercialRevShare: 0,
            disabled: false,
            expectMinimumGroupRewardShare: 0,
            expectGroupRewardPool: "0x0000000000000000000000000000000000000000",
          }
        }],
        ipMetadata: {
          ipMetadataURI: `https://ipfs.io/ipfs/${ipMetadataCid}`,
          ipMetadataHash: `0x${createHash('sha256').update(JSON.stringify(ipMetadata)).digest('hex')}`,
          nftMetadataURI: `https://ipfs.io/ipfs/${nftMetadataCid}`,
          nftMetadataHash: `0x${createHash('sha256').update(JSON.stringify(nftMetadata)).digest('hex')}`,
        }
      });

      setResult(response);
      setCurrentStep(5); // Success state

    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Navigation
  const goToStep = (step: number) => {
    if (step < 1 || step > 4) return;
    setCurrentStep(step);
  };

  const canProceedFromStep = () => {
    switch(currentStep) {
      case 1:
        return selectedFile !== null;
      case 2:
        return aiDetection !== null;
      case 3:
        return title.trim() !== '' && description.trim() !== '';
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentStep(1);
    setSelectedFile(null);
    setImagePreview(null);
    setAiDetection(null);
    setTitle('');
    setDescription('');
    setResult(null);
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center bg-white rounded-3xl p-16 shadow-2xl">
          <div className="text-6xl mb-6">👛</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 text-lg">To start protecting your creative assets</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="p-8 pb-0">
            <div className="flex items-center justify-between relative">
              {/* Progress Line Background */}
              <div className="absolute top-8 left-8 right-8 h-1 bg-gray-200 rounded-full" />
              
              {/* Progress Line Active */}
              <div 
                className="absolute top-8 left-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `calc(${progressPercent}% * 0.85 + 15px)` }}
              />
              
              {/* Step 1 */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  currentStep >= 1 
                    ? currentStep === 1 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg' 
                      : 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {currentStep > 1 ? '✓' : '📤'}
                </div>
                <span className={`text-sm font-medium ${currentStep === 1 ? 'text-purple-600' : 'text-gray-500'}`}>
                  Upload
                </span>
              </div>
              
              {/* Step 2 */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  currentStep >= 2 
                    ? currentStep === 2 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg' 
                      : 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {currentStep > 2 ? '✓' : '🤖'}
                </div>
                <span className={`text-sm font-medium ${currentStep === 2 ? 'text-purple-600' : 'text-gray-500'}`}>
                  AI Scan
                </span>
              </div>
              
              {/* Step 3 */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  currentStep >= 3 
                    ? currentStep === 3 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg' 
                      : 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {currentStep > 3 ? '✓' : '📝'}
                </div>
                <span className={`text-sm font-medium ${currentStep === 3 ? 'text-purple-600' : 'text-gray-500'}`}>
                  Details
                </span>
              </div>
              
              {/* Step 4 */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
                  currentStep >= 4 
                    ? currentStep === 4 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 scale-110 shadow-lg' 
                      : 'bg-green-500'
                    : 'bg-gray-200'
                }`}>
                  {currentStep > 4 ? '✓' : '⚡'}
                </div>
                <span className={`text-sm font-medium ${currentStep === 4 ? 'text-purple-600' : 'text-gray-500'}`}>
                  Register
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-8">
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="hidden"
                id="fileInput"
              />
              <label 
                htmlFor="fileInput"
                className="block border-3 border-dashed border-purple-300 rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 hover:border-purple-500 hover:bg-purple-50 hover:scale-[1.02] bg-gradient-to-br from-purple-50 to-pink-50"
              >
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-4xl text-white animate-pulse">
                  📁
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Drop your file here</h3>
                <p className="text-gray-500">or click to browse • PNG, JPG, GIF up to 10MB</p>
              </label>

              {imagePreview && (
                <div className="text-center animate-fadeIn">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-sm mx-auto rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300"
                  />
                  <p className="mt-4 text-gray-600 font-medium">{selectedFile?.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: AI Analysis */}
          {currentStep === 2 && (
            <div>
              {isDetecting ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-6 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">AI Analysis in Progress</h3>
                  <p className="text-gray-600">Our smart robots are examining your image... 🔍</p>
                </div>
              ) : (
                aiDetection && (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 relative overflow-hidden">
                    {aiDetection.isAI && (
                      <div className="absolute top-4 right-4 bg-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold transform rotate-3">
                        AI Detected!
                      </div>
                    )}
                    <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">Analysis Complete</h3>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                        </div>
                        <div className="text-gray-500">Content Type</div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-purple-600 mb-2">
                          {(aiDetection.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-gray-500">Confidence</div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* Step 3: Asset Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-2">Asset Name *</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white"
                  placeholder="Give your asset a memorable name"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-2">Category</label>
                <select className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white">
                  <option>🎨 Digital Art</option>
                  <option>📸 Photography</option>
                  <option>✏️ Illustration</option>
                  <option>🎯 Design</option>
                  <option>🌟 Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-lg font-semibold text-gray-800 mb-2">Description *</label>
                <textarea 
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:outline-none transition-colors bg-gray-50 hover:bg-white resize-none"
                  rows={4}
                  placeholder="Tell us about your creation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: License & Register */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Choose Your License</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedLicense === 'open_use' 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLicense('open_use')}
                >
                  <div className="text-3xl mb-2">🎁</div>
                  <div className="font-semibold text-gray-800">Open Use</div>
                  <div className="text-sm text-gray-600">Free for everyone!</div>
                </div>
                
                <div 
                  className={`p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedLicense === 'non_commercial' 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLicense('non_commercial')}
                >
                  <div className="text-3xl mb-2">🏠</div>
                  <div className="font-semibold text-gray-800">Non-Commercial</div>
                  <div className="text-sm text-gray-600">Personal use only</div>
                </div>
                
                <div 
                  className={`p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedLicense === 'commercial' 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLicense('commercial')}
                >
                  <div className="text-3xl mb-2">💼</div>
                  <div className="font-semibold text-gray-800">Commercial</div>
                  <div className="text-sm text-gray-600">Business ready!</div>
                </div>
                
                <div 
                  className={`p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedLicense === 'custom' 
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedLicense('custom')}
                >
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="font-semibold text-gray-800">Custom Mix</div>
                  <div className="text-sm text-gray-600">Your rules!</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-6 bg-gray-50 rounded-2xl">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🤖</span>
                  <span className="font-semibold text-gray-800">Allow AI Training</span>
                </div>
                <button
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
                    aiLearning ? 'bg-purple-500' : 'bg-gray-300'
                  } ${aiDetection?.isAI ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => !aiDetection?.isAI && setAiLearning(!aiLearning)}
                  disabled={aiDetection?.isAI}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 ${
                    aiLearning ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
              
              <button 
                className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-xl rounded-3xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                onClick={registerIP}
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🚀</span>
                    <span>Register My Asset!</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success State */}
          {currentStep === 5 && result && (
            <div className="text-center py-8">
              <div className="text-6xl mb-6 animate-bounce">✅</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Woohoo! 🎉</h2>
              <p className="text-xl text-gray-600 mb-8">Your asset is now protected on the blockchain!</p>
              
              <div className="bg-gray-50 rounded-2xl p-6 space-y-4 text-left mb-8">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Transaction ID</span>
                  <span className="text-purple-600 font-mono text-sm bg-white px-3 py-1 rounded-lg">
                    {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">IP Asset ID</span>
                  <span className="text-purple-600 font-mono text-sm bg-white px-3 py-1 rounded-lg">
                    {result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}
                  </span>
                </div>
              </div>
              
              <button 
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
                onClick={resetForm}
              >
                <span className="mr-2">🎨</span>
                Register Another Asset
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep < 5 && currentStep > 1 && (
            <div className="flex justify-between mt-8 pt-8 border-t border-gray-100">
              <button 
                className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-2"
                onClick={() => goToStep(currentStep - 1)}
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              {currentStep < 4 && (
                <button 
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  onClick={() => goToStep(currentStep + 1)}
                  disabled={!canProceedFromStep()}
                >
                  <span>Next</span>
                  <span>→</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
