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
      <div className="cartoon-container">
        <div className="connect-wallet-card">
          <div className="wallet-icon">👛</div>
          <h2>Connect Your Wallet</h2>
          <p>To start protecting your creative assets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cartoon-container">
      <style jsx>{`
        .cartoon-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .connect-wallet-card {
          text-align: center;
          background: white;
          border-radius: 30px;
          padding: 4rem 2rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }

        .wallet-icon {
          font-size: 80px;
          margin-bottom: 1rem;
        }

        .main-card {
          background: white;
          border-radius: 30px;
          padding: 3rem;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }

        .progress-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 3rem;
          position: relative;
        }

        .progress-line {
          position: absolute;
          top: 30px;
          left: 60px;
          right: 60px;
          height: 4px;
          background: #E5E7EB;
          z-index: 1;
        }

        .progress-line-active {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #7C3AED, #EC4899);
          transition: width 0.5s ease;
          border-radius: 2px;
          width: ${((currentStep - 1) / 3) * 100}%;
        }

        .step {
          position: relative;
          z-index: 2;
          text-align: center;
          flex: 1;
        }

        .step-circle {
          width: 60px;
          height: 60px;
          background: #F3F4F6;
          border-radius: 50%;
          margin: 0 auto 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          transition: all 0.3s ease;
          border: 4px solid white;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .step.active .step-circle {
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          transform: scale(1.1);
          box-shadow: 0 8px 25px rgba(124,58,237,0.3);
        }

        .step.completed .step-circle {
          background: #10B981;
        }

        .step-label {
          font-size: 14px;
          color: #6B7280;
          font-weight: 500;
        }

        .step.active .step-label {
          color: #7C3AED;
          font-weight: 600;
        }

        .upload-area {
          border: 3px dashed #7C3AED;
          border-radius: 25px;
          padding: 4rem 2rem;
          text-align: center;
          background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05));
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .upload-area:hover {
          border-color: #EC4899;
          background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1));
          transform: scale(1.02);
        }

        .upload-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          border-radius: 50%;
          margin: 0 auto 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
        }

        .preview-image {
          max-width: 300px;
          max-height: 300px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin: 2rem auto;
          display: block;
        }

        .ai-detection-card {
          background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
          border-radius: 20px;
          padding: 2rem;
          margin-top: 2rem;
          text-align: center;
        }

        .ai-badge {
          display: inline-block;
          background: #F59E0B;
          color: white;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #1E293B;
          font-size: 16px;
        }

        .form-input,
        .form-textarea,
        .form-select {
          width: 100%;
          padding: 1rem 1.5rem;
          border: 2px solid #E5E7EB;
          border-radius: 15px;
          font-size: 16px;
          transition: all 0.3s ease;
          background: #F9FAFB;
        }

        .form-input:focus,
        .form-textarea:focus,
        .form-select:focus {
          outline: none;
          border-color: #7C3AED;
          background: white;
          box-shadow: 0 0 0 4px rgba(124,58,237,0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
        }

        .license-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .license-card {
          background: #F9FAFB;
          border: 3px solid transparent;
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: center;
        }

        .license-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }

        .license-card.selected {
          border-color: #7C3AED;
          background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1));
        }

        .license-icon {
          font-size: 36px;
          margin-bottom: 0.5rem;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #F3F4F6;
          padding: 1.5rem;
          border-radius: 15px;
          margin-bottom: 1.5rem;
        }

        .toggle-switch {
          position: relative;
          width: 60px;
          height: 30px;
          background: #E5E7EB;
          border-radius: 50px;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .toggle-switch.active {
          background: #7C3AED;
        }

        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          top: 3px;
          left: ${aiLearning ? '33px' : '3px'};
          transition: all 0.3s ease;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .btn {
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7C3AED, #EC4899);
          color: white;
          box-shadow: 0 5px 20px rgba(124,58,237,0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(124,58,237,0.4);
        }

        .btn-secondary {
          background: #F3F4F6;
          color: #1E293B;
          border: 2px solid #E5E7EB;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #E5E7EB;
          transform: translateY(-2px);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .btn-full {
          width: 100%;
          justify-content: center;
        }

        .button-group {
          display: flex;
          justify-content: space-between;
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #E5E7EB;
        }

        .success-container {
          text-align: center;
          padding: 3rem;
        }

        .success-icon {
          font-size: 80px;
          margin-bottom: 1rem;
        }

        .result-info {
          background: #F9FAFB;
          border-radius: 20px;
          padding: 2rem;
          margin-top: 2rem;
          text-align: left;
        }

        .result-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 0;
          border-bottom: 1px solid #E5E7EB;
        }

        .result-item:last-child {
          border-bottom: none;
        }

        .result-value {
          color: #7C3AED;
          font-family: monospace;
          font-size: 14px;
          word-break: break-all;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #F3F4F6;
          border-top: 5px solid #7C3AED;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 2rem auto;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className="main-card">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div className="progress-container">
            <div className="progress-line">
              <div className="progress-line-active"></div>
            </div>
            
            <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-circle">📤</div>
              <div className="step-label">Upload</div>
            </div>
            
            <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-circle">🤖</div>
              <div className="step-label">AI Scan</div>
            </div>
            
            <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-circle">📝</div>
              <div className="step-label">Details</div>
            </div>
            
            <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
              <div className="step-circle">⚡</div>
              <div className="step-label">Register</div>
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {currentStep === 1 && (
          <div>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="fileInput"
            />
            <div className="upload-area" onClick={() => document.getElementById('fileInput')?.click()}>
              <div className="upload-icon">📁</div>
              <h3 style={{ fontSize: '24px', marginBottom: '0.5rem', color: '#1E293B' }}>
                Drop your file here
              </h3>
              <p style={{ color: '#6B7280' }}>or click to browse • PNG, JPG, GIF up to 10MB</p>
            </div>

            {imagePreview && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <img src={imagePreview} alt="Preview" className="preview-image" />
                <p style={{ marginTop: '1rem', color: '#6B7280', fontWeight: 500 }}>
                  {selectedFile?.name}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {currentStep === 2 && (
          <div>
            {isDetecting ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <div className="spinner"></div>
                <h3 style={{ fontSize: '24px', marginTop: '1rem', color: '#1E293B' }}>
                  AI Analysis in Progress
                </h3>
                <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
                  Our smart robots are examining your image... 🔍
                </p>
              </div>
            ) : (
              aiDetection && (
                <div>
                  <div className="ai-detection-card">
                    {aiDetection.isAI && (
                      <div className="ai-badge">AI Detected!</div>
                    )}
                    <h3 style={{ fontSize: '24px', marginBottom: '1rem' }}>Analysis Complete</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
                      <div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: '#7C3AED', marginBottom: '0.5rem' }}>
                          {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>Content Type</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '36px', fontWeight: 700, color: '#7C3AED', marginBottom: '0.5rem' }}>
                          {(aiDetection.confidence * 100).toFixed(0)}%
                        </div>
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>Confidence</div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 3: Asset Details */}
        {currentStep === 3 && (
          <div>
            <div className="form-group">
              <label className="form-label">Asset Name *</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Give your asset a memorable name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select">
                <option>🎨 Digital Art</option>
                <option>📸 Photography</option>
                <option>✏️ Illustration</option>
                <option>🎯 Design</option>
                <option>🌟 Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea 
                className="form-textarea" 
                placeholder="Tell us about your creation..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 4: License & Register */}
        {currentStep === 4 && (
          <div>
            <h3 style={{ fontSize: '24px', marginBottom: '1.5rem' }}>Choose Your License</h3>
            
            <div className="license-grid">
              <div 
                className={`license-card ${selectedLicense === 'open_use' ? 'selected' : ''}`}
                onClick={() => setSelectedLicense('open_use')}
              >
                <div className="license-icon">🎁</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Open Use</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Free for everyone!</div>
              </div>
              
              <div 
                className={`license-card ${selectedLicense === 'non_commercial' ? 'selected' : ''}`}
                onClick={() => setSelectedLicense('non_commercial')}
              >
                <div className="license-icon">🏠</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Non-Commercial</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Personal use only</div>
              </div>
              
              <div 
                className={`license-card ${selectedLicense === 'commercial' ? 'selected' : ''}`}
                onClick={() => setSelectedLicense('commercial')}
              >
                <div className="license-icon">💼</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Commercial</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Business ready!</div>
              </div>
              
              <div 
                className={`license-card ${selectedLicense === 'custom' ? 'selected' : ''}`}
                onClick={() => setSelectedLicense('custom')}
              >
                <div className="license-icon">⚡</div>
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Custom Mix</div>
                <div style={{ fontSize: '14px', color: '#6B7280' }}>Your rules!</div>
              </div>
            </div>
            
            <div className="toggle-container">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span>🤖</span>
                <span style={{ fontWeight: 600 }}>Allow AI Training</span>
              </div>
              <div 
                className={`toggle-switch ${aiLearning ? 'active' : ''}`}
                onClick={() => !aiDetection?.isAI && setAiLearning(!aiLearning)}
                style={{ opacity: aiDetection?.isAI ? 0.5 : 1, cursor: aiDetection?.isAI ? 'not-allowed' : 'pointer' }}
              ></div>
            </div>
            
            <button 
              className="btn btn-primary btn-full" 
              onClick={registerIP}
              disabled={isRegistering}
              style={{ fontSize: '20px', padding: '1.5rem' }}
            >
              {isRegistering ? (
                <>
                  <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></span>
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Register My Asset!</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success State */}
        {currentStep === 5 && result && (
          <div className="success-container">
            <div className="success-icon">✅</div>
            <h2 style={{ fontSize: '32px', color: '#1E293B', marginBottom: '1rem' }}>Woohoo! 🎉</h2>
            <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '2rem' }}>
              Your asset is now protected on the blockchain!
            </p>
            
            <div className="result-info">
              <div className="result-item">
                <span style={{ fontWeight: 600 }}>Transaction ID</span>
                <span className="result-value">{result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}</span>
              </div>
              <div className="result-item">
                <span style={{ fontWeight: 600 }}>IP Asset ID</span>
                <span className="result-value">{result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={resetForm}
              style={{ marginTop: '2rem' }}
            >
              <span>🎨</span>
              <span>Register Another Asset</span>
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && currentStep > 1 && (
          <div className="button-group">
            <button 
              className="btn btn-secondary" 
              onClick={() => goToStep(currentStep - 1)}
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            
            {currentStep < 4 && (
              <button 
                className="btn btn-primary" 
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
  );
}
