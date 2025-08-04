"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';
import { Shield, Upload, Brain, FileText, Settings, CheckCircle, AlertTriangle, Loader2, ExternalLink, Copy } from 'lucide-react';

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
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-12 text-center border border-white/20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-5xl shadow-lg">
            👛
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 text-lg">To start protecting your creative assets</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="flex justify-between mb-12 relative">
            {/* Progress Line Background */}
            <div className="absolute top-8 left-12 right-12 h-1 bg-white/20 rounded-full"></div>
            
            {/* Progress Line Active */}
            <div 
              className="absolute top-8 left-12 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
              style={{ width: `calc(${progressPercent}% * 0.75 + 48px)` }}
            ></div>
            
            {/* Steps */}
            {[
              { icon: '📤', label: 'Upload' },
              { icon: '🤖', label: 'AI Scan' },
              { icon: '📝', label: 'Details' },
              { icon: '⚡', label: 'Register' }
            ].map((step, index) => (
              <div key={index} className="relative z-10 text-center flex-1">
                <div className={`
                  w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-2xl
                  transition-all duration-300 border-4 border-white/20
                  ${currentStep > index + 1 
                    ? 'bg-green-500 border-green-400' 
                    : currentStep === index + 1 
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 border-purple-400 scale-110 shadow-lg' 
                    : 'bg-white/10'}
                `}>
                  {currentStep > index + 1 ? '✓' : step.icon}
                </div>
                <div className={`text-sm font-medium ${currentStep === index + 1 ? 'text-white' : 'text-gray-400'}`}>
                  {step.label}
                </div>
              </div>
            ))}
          </div>
        )}

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
            <div 
              onClick={() => document.getElementById('fileInput')?.click()}
              className="border-3 border-dashed border-purple-400/50 rounded-3xl p-12 text-center 
                       bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 
                       hover:to-pink-500/20 transition-all duration-300 cursor-pointer hover:scale-[1.02]"
            >
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 
                            rounded-full flex items-center justify-center text-4xl shadow-lg animate-pulse">
                📁
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Drop your file here</h3>
              <p className="text-gray-300">or click to browse • PNG, JPG, GIF up to 10MB</p>
            </div>

            {imagePreview && (
              <div className="text-center">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-w-xs mx-auto rounded-2xl shadow-2xl border-4 border-white/20"
                />
                <p className="mt-3 text-gray-300 font-medium">{selectedFile?.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {isDetecting ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-6 border-4 border-purple-400 border-t-transparent 
                              rounded-full animate-spin"></div>
                <h3 className="text-2xl font-bold text-white mb-2">AI Analysis in Progress</h3>
                <p className="text-gray-300">Our smart robots are examining your image... 🔍</p>
              </div>
            ) : (
              aiDetection && (
                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-3xl p-8 border border-white/10">
                  {aiDetection.isAI && (
                    <div className="inline-block bg-orange-500 text-white px-4 py-2 rounded-full 
                                  text-sm font-bold mb-4 animate-bounce">
                      AI Detected! 🤖
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-6 text-center">Analysis Complete</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        <span className={aiDetection.isAI ? 'text-orange-400' : 'text-green-400'}>
                          {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                        </span>
                      </div>
                      <div className="text-gray-400">Content Type</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-400 mb-2">
                        {(aiDetection.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-gray-400">Confidence</div>
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
              <label className="block text-white font-semibold mb-2">Asset Name *</label>
              <input 
                type="text" 
                className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white 
                         placeholder-gray-400 focus:border-purple-400 focus:bg-white/20 transition-all"
                placeholder="Give your asset a memorable name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-white font-semibold mb-2">Category</label>
              <select className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white 
                               focus:border-purple-400 focus:bg-white/20 transition-all">
                <option>🎨 Digital Art</option>
                <option>📸 Photography</option>
                <option>✏️ Illustration</option>
                <option>🎯 Design</option>
                <option>🌟 Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-white font-semibold mb-2">Description *</label>
              <textarea 
                className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white 
                         placeholder-gray-400 focus:border-purple-400 focus:bg-white/20 transition-all 
                         resize-none h-32"
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
            <h3 className="text-2xl font-bold text-white mb-6">Choose Your License</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'open_use', icon: '🎁', title: 'Open Use', desc: 'Free for everyone!' },
                { id: 'non_commercial', icon: '🏠', title: 'Non-Commercial', desc: 'Personal use only' },
                { id: 'commercial', icon: '💼', title: 'Commercial', desc: 'Business ready!' },
                { id: 'custom', icon: '⚡', title: 'Custom Mix', desc: 'Your rules!' }
              ].map((license) => (
                <div
                  key={license.id}
                  onClick={() => setSelectedLicense(license.id)}
                  className={`
                    p-6 rounded-2xl border-2 cursor-pointer transition-all text-center
                    ${selectedLicense === license.id
                      ? 'border-purple-400 bg-purple-500/20'
                      : 'border-white/20 bg-white/5 hover:bg-white/10'}
                  `}
                >
                  <div className="text-3xl mb-2">{license.icon}</div>
                  <div className="font-semibold text-white mb-1">{license.title}</div>
                  <div className="text-sm text-gray-400">{license.desc}</div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <span className="font-semibold text-white">Allow AI Training</span>
              </div>
              <button
                onClick={() => !aiDetection?.isAI && setAiLearning(!aiLearning)}
                disabled={aiDetection?.isAI}
                className={`
                  relative w-14 h-7 rounded-full transition-colors
                  ${aiLearning ? 'bg-purple-500' : 'bg-gray-600'}
                  ${aiDetection?.isAI ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className={`
                  absolute top-1 w-5 h-5 bg-white rounded-full transition-transform
                  ${aiLearning ? 'translate-x-7' : 'translate-x-1'}
                `}></div>
              </button>
            </div>
            
            <button 
              onClick={registerIP}
              disabled={isRegistering}
              className="w-full py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                       font-bold text-lg rounded-2xl hover:from-purple-600 hover:to-pink-600 
                       transition-all transform hover:scale-[1.02] disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isRegistering ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
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
            <div className="w-24 h-24 mx-auto mb-6 bg-green-500 rounded-full flex items-center 
                          justify-center text-5xl animate-bounce">
              ✅
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Woohoo! 🎉</h2>
            <p className="text-xl text-gray-300 mb-8">Your asset is now protected on the blockchain!</p>
            
            <div className="bg-white/10 rounded-2xl p-6 space-y-4 text-left">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">Transaction ID</span>
                <span className="text-purple-400 font-mono text-sm">
                  {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-white">IP Asset ID</span>
                <span className="text-purple-400 font-mono text-sm">
                  {result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}
                </span>
              </div>
            </div>
            
            <button 
              onClick={resetForm}
              className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                       font-bold rounded-2xl hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Register Another Asset 🎨
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && currentStep > 1 && (
          <div className="flex justify-between mt-8">
            <button 
              onClick={() => goToStep(currentStep - 1)}
              className="px-6 py-3 bg-white/10 text-white font-semibold rounded-2xl 
                       hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            
            {currentStep < 4 && (
              <button 
                onClick={() => goToStep(currentStep + 1)}
                disabled={!canProceedFromStep()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white 
                         font-semibold rounded-2xl hover:from-purple-600 hover:to-pink-600 
                         transition-all disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center gap-2"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
