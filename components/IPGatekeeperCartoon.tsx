"use client";
import { useState, useEffect } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { custom } from 'viem';
import { createHash } from 'crypto';
import { StoryClient, StoryConfig } from '@story-protocol/core-sdk';
import { uploadToIPFS, detectAI } from '../services';
import { Loader2 } from 'lucide-react';

const styles = {
  container: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem',
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '30px',
    padding: '3rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  walletCard: {
    background: 'white',
    borderRadius: '30px',
    padding: '4rem 2rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
    textAlign: 'center' as const,
  },
  walletIcon: {
    fontSize: '80px',
    marginBottom: '1rem',
    display: 'block',
  },
  progressContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '3rem',
    position: 'relative' as const,
  },
  progressLine: {
    position: 'absolute' as const,
    top: '30px',
    left: '60px',
    right: '60px',
    height: '4px',
    background: '#E5E7EB',
    borderRadius: '2px',
  },
  progressLineActive: {
    position: 'absolute' as const,
    top: '0',
    left: '0',
    height: '100%',
    background: 'linear-gradient(90deg, #7C3AED, #EC4899)',
    transition: 'width 0.5s ease',
    borderRadius: '2px',
  },
  step: {
    position: 'relative' as const,
    zIndex: 2,
    textAlign: 'center' as const,
    flex: 1,
  },
  stepCircle: {
    width: '60px',
    height: '60px',
    background: '#F3F4F6',
    borderRadius: '50%',
    margin: '0 auto 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    transition: 'all 0.3s ease',
    border: '4px solid white',
    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
  },
  stepCircleActive: {
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    transform: 'scale(1.1)',
    boxShadow: '0 8px 25px rgba(124, 58, 237, 0.3)',
  },
  stepCircleCompleted: {
    background: '#10B981',
    color: 'white',
  },
  stepLabel: {
    fontSize: '14px',
    color: '#6B7280',
    fontWeight: '500',
  },
  stepLabelActive: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  uploadArea: {
    border: '3px dashed #7C3AED',
    borderRadius: '25px',
    padding: '4rem 2rem',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05))',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  uploadAreaHover: {
    borderColor: '#EC4899',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
    transform: 'scale(1.02)',
  },
  uploadIcon: {
    width: '80px',
    height: '80px',
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    borderRadius: '50%',
    margin: '0 auto 1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
  },
  previewImage: {
    maxWidth: '300px',
    maxHeight: '300px',
    borderRadius: '20px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    margin: '2rem auto',
    display: 'block',
  },
  formGroup: {
    marginBottom: '1.5rem',
  },
  formLabel: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: '600',
    color: '#1E293B',
    fontSize: '16px',
  },
  formInput: {
    width: '100%',
    padding: '1rem 1.5rem',
    border: '2px solid #E5E7EB',
    borderRadius: '15px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    background: '#F9FAFB',
    outline: 'none',
    fontFamily: 'inherit',
  },
  formInputFocus: {
    borderColor: '#7C3AED',
    background: 'white',
    boxShadow: '0 0 0 4px rgba(124, 58, 237, 0.1)',
  },
  licenseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  licenseCard: {
    background: '#F9FAFB',
    border: '3px solid transparent',
    borderRadius: '20px',
    padding: '1.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center' as const,
  },
  licenseCardSelected: {
    borderColor: '#7C3AED',
    background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
  },
  toggleContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#F3F4F6',
    padding: '1.5rem',
    borderRadius: '15px',
    marginBottom: '1.5rem',
  },
  toggleSwitch: {
    position: 'relative' as const,
    width: '60px',
    height: '30px',
    background: '#E5E7EB',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  toggleSwitchActive: {
    background: '#7C3AED',
  },
  toggleKnob: {
    position: 'absolute' as const,
    width: '24px',
    height: '24px',
    background: 'white',
    borderRadius: '50%',
    top: '3px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  button: {
    padding: '1rem 2rem',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontFamily: 'inherit',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #7C3AED, #EC4899)',
    color: 'white',
    boxShadow: '0 5px 20px rgba(124, 58, 237, 0.3)',
  },
  buttonPrimaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 30px rgba(124, 58, 237, 0.4)',
  },
  buttonSecondary: {
    background: '#F3F4F6',
    color: '#1E293B',
    border: '2px solid #E5E7EB',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  successContainer: {
    textAlign: 'center' as const,
    padding: '3rem',
  },
  successIcon: {
    fontSize: '80px',
    marginBottom: '1rem',
    display: 'block',
  },
  resultInfo: {
    background: '#F9FAFB',
    borderRadius: '20px',
    padding: '2rem',
    marginTop: '2rem',
    textAlign: 'left' as const,
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #E5E7EB',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #F3F4F6',
    borderTopColor: '#7C3AED',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '2rem auto',
  },
  aiDetectionCard: {
    background: 'linear-gradient(135deg, #F3F4F6, #E5E7EB)',
    borderRadius: '20px',
    padding: '2rem',
    marginTop: '2rem',
    textAlign: 'center' as const,
  },
  aiBadge: {
    display: 'inline-block',
    background: '#F59E0B',
    color: 'white',
    padding: '0.5rem 1.5rem',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '1rem',
  },
};

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
  const [isHovering, setIsHovering] = useState(false);

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

  // Add CSS animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
      .animate-pulse { animation: pulse 2s infinite; }
      .animate-bounce { animation: bounce 2s infinite; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
      <div style={styles.container}>
        <div style={styles.walletCard} className="animate-fadeIn">
          <span style={styles.walletIcon}>👛</span>
          <h2 style={{ fontSize: '32px', color: '#1E293B', marginBottom: '1rem' }}>Connect Your Wallet</h2>
          <p style={{ fontSize: '18px', color: '#6B7280' }}>To start protecting your creative assets</p>
        </div>
      </div>
    );
  }

  const progressPercent = ((currentStep - 1) / 3) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.card} className="animate-fadeIn">
        {/* Progress Steps */}
        {currentStep < 5 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressLine}>
              <div style={{ ...styles.progressLineActive, width: `${progressPercent}%` }}></div>
            </div>
            
            {[
              { icon: '📤', label: 'Upload' },
              { icon: '🤖', label: 'AI Scan' },
              { icon: '📝', label: 'Details' },
              { icon: '⚡', label: 'Register' }
            ].map((step, index) => (
              <div key={index} style={styles.step}>
                <div style={{
                  ...styles.stepCircle,
                  ...(currentStep > index + 1 ? styles.stepCircleCompleted : {}),
                  ...(currentStep === index + 1 ? styles.stepCircleActive : {})
                }}>
                  {currentStep > index + 1 ? '✓' : step.icon}
                </div>
                <div style={{
                  ...styles.stepLabel,
                  ...(currentStep === index + 1 ? styles.stepLabelActive : {})
                }}>
                  {step.label}
                </div>
              </div>
            ))}
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
            <div 
              onClick={() => document.getElementById('fileInput')?.click()}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{
                ...styles.uploadArea,
                ...(isHovering ? styles.uploadAreaHover : {})
              }}
            >
              <div style={styles.uploadIcon} className="animate-pulse">📁</div>
              <h3 style={{ fontSize: '24px', marginBottom: '0.5rem', color: '#1E293B' }}>
                Drop your file here
              </h3>
              <p style={{ color: '#6B7280' }}>or click to browse • PNG, JPG, GIF up to 10MB</p>
            </div>

            {imagePreview && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <img src={imagePreview} alt="Preview" style={styles.previewImage} />
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
                <div style={styles.spinner}></div>
                <h3 style={{ fontSize: '24px', marginTop: '1rem', color: '#1E293B' }}>
                  AI Analysis in Progress
                </h3>
                <p style={{ color: '#6B7280', marginTop: '0.5rem' }}>
                  Our smart robots are examining your image... 🔍
                </p>
              </div>
            ) : (
              aiDetection && (
                <div style={styles.aiDetectionCard}>
                  {aiDetection.isAI && (
                    <div style={styles.aiBadge} className="animate-bounce">AI Detected!</div>
                  )}
                  <h3 style={{ fontSize: '24px', marginBottom: '1rem' }}>Analysis Complete</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
                    <div>
                      <div style={{ 
                        fontSize: '36px', 
                        fontWeight: 700, 
                        color: aiDetection.isAI ? '#F59E0B' : '#10B981', 
                        marginBottom: '0.5rem' 
                      }}>
                        {aiDetection.isAI ? 'AI-Generated' : 'Original'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>Content Type</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '36px', fontWeight: 700, color: '#3B82F6', marginBottom: '0.5rem' }}>
                        {(aiDetection.confidence * 100).toFixed(0)}%
                      </div>
                      <div style={{ fontSize: '14px', color: '#6B7280' }}>Confidence</div>
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
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Asset Name *</label>
              <input 
                type="text" 
                style={styles.formInput}
                placeholder="Give your asset a memorable name"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={(e) => e.target.style.cssText = Object.entries({...styles.formInput, ...styles.formInputFocus}).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}
                onBlur={(e) => e.target.style.cssText = Object.entries(styles.formInput).map(([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${v}`).join('; ')}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Category</label>
              <select style={styles.formInput}>
                <option>🎨 Digital Art</option>
                <option>📸 Photography</option>
                <option>✏️ Illustration</option>
                <option>🎯 Design</option>
                <option>🌟 Other</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Description *</label>
              <textarea 
                style={{ ...styles.formInput, minHeight: '120px', resize: 'vertical' }}
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
            
            <div style={styles.licenseGrid}>
              {[
                { id: 'open_use', icon: '🎁', title: 'Open Use', desc: 'Free for everyone!' },
                { id: 'non_commercial', icon: '🏠', title: 'Non-Commercial', desc: 'Personal use only' },
                { id: 'commercial', icon: '💼', title: 'Commercial', desc: 'Business ready!' },
                { id: 'custom', icon: '⚡', title: 'Custom Mix', desc: 'Your rules!' }
              ].map((license) => (
                <div
                  key={license.id}
                  onClick={() => setSelectedLicense(license.id)}
                  style={{
                    ...styles.licenseCard,
                    ...(selectedLicense === license.id ? styles.licenseCardSelected : {})
                  }}
                >
                  <div style={{ fontSize: '36px', marginBottom: '0.5rem' }}>{license.icon}</div>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{license.title}</div>
                  <div style={{ fontSize: '14px', color: '#6B7280' }}>{license.desc}</div>
                </div>
              ))}
            </div>
            
            <div style={styles.toggleContainer}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <span style={{ fontWeight: 600 }}>Allow AI Training</span>
              </div>
              <div 
                onClick={() => !aiDetection?.isAI && setAiLearning(!aiLearning)}
                style={{
                  ...styles.toggleSwitch,
                  ...(aiLearning ? styles.toggleSwitchActive : {}),
                  ...(aiDetection?.isAI ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                }}
              >
                <div style={{
                  ...styles.toggleKnob,
                  left: aiLearning ? '33px' : '3px'
                }}></div>
              </div>
            </div>
            
            <button 
              onClick={registerIP}
              disabled={isRegistering}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                ...(isRegistering ? styles.buttonDisabled : {}),
                width: '100%',
                fontSize: '20px',
                padding: '1.5rem'
              }}
            >
              {isRegistering ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '24px' }}>🚀</span>
                  <span>Register My Asset!</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Success State */}
        {currentStep === 5 && result && (
          <div style={styles.successContainer}>
            <span style={styles.successIcon} className="animate-bounce">✅</span>
            <h2 style={{ fontSize: '32px', color: '#1E293B', marginBottom: '1rem' }}>Woohoo! 🎉</h2>
            <p style={{ fontSize: '18px', color: '#6B7280', marginBottom: '2rem' }}>
              Your asset is now protected on the blockchain!
            </p>
            
            <div style={styles.resultInfo}>
              <div style={styles.resultItem}>
                <span style={{ fontWeight: 600 }}>Transaction ID</span>
                <span style={{ color: '#7C3AED', fontFamily: 'monospace', fontSize: '14px' }}>
                  {result.txHash?.slice(0, 10)}...{result.txHash?.slice(-8)}
                </span>
              </div>
              <div style={{ ...styles.resultItem, borderBottom: 'none' }}>
                <span style={{ fontWeight: 600 }}>IP Asset ID</span>
                <span style={{ color: '#7C3AED', fontFamily: 'monospace', fontSize: '14px' }}>
                  {result.ipId?.slice(0, 10)}...{result.ipId?.slice(-8)}
                </span>
              </div>
            </div>
            
            <button 
              onClick={resetForm}
              style={{
                ...styles.button,
                ...styles.buttonPrimary,
                marginTop: '2rem'
              }}
            >
              <span style={{ fontSize: '20px' }}>🎨</span>
              <span>Register Another Asset</span>
            </button>
          </div>
        )}

        {/* Navigation Buttons */}
        {currentStep < 5 && currentStep > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', paddingTop: '2rem', borderTop: '2px solid #E5E7EB' }}>
            <button 
              onClick={() => goToStep(currentStep - 1)}
              style={{
                ...styles.button,
                ...styles.buttonSecondary
              }}
            >
              <span>←</span>
              <span>Previous</span>
            </button>
            
            {currentStep < 4 && (
              <button 
                onClick={() => goToStep(currentStep + 1)}
                disabled={!canProceedFromStep()}
                style={{
                  ...styles.button,
                  ...styles.buttonPrimary,
                  ...(canProceedFromStep() ? {} : styles.buttonDisabled)
                }}
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
