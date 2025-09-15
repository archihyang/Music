"""
70-80년대 기타리스트 스타일 분석 AI 모델
SpectroFusionNet - 99.12% 정확도 목표
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import librosa
import torchaudio
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from pathlib import Path
import json
import logging

logger = logging.getLogger(__name__)

# 70-80년대 레전드 기타리스트 정의
GUITAR_LEGENDS = {
    "jimmy_page": {
        "name": "Jimmy Page",
        "band": "Led Zeppelin",
        "style_features": ["blues_rock", "heavy_riffs", "acoustic_folk", "eastern_scales"],
        "signature_techniques": ["bowing", "alternate_tunings", "layered_guitars"]
    },
    "eric_clapton": {
        "name": "Eric Clapton",
        "band": "Cream/Solo",
        "style_features": ["blues", "smooth_lead", "emotional_bends", "pentatonic"],
        "signature_techniques": ["woman_tone", "vibrato", "blues_phrasing"]
    },
    "jimi_hendrix": {
        "name": "Jimi Hendrix",
        "band": "Experience",
        "style_features": ["psychedelic", "feedback", "rhythm_lead", "blues_rock"],
        "signature_techniques": ["thumb_fretting", "wah_wah", "octaves", "feedback_control"]
    },
    "david_gilmour": {
        "name": "David Gilmour",
        "band": "Pink Floyd",
        "style_features": ["melodic", "atmospheric", "sustained_notes", "emotional"],
        "signature_techniques": ["bending", "delay_effects", "volume_swells", "slide"]
    },
    "brian_may": {
        "name": "Brian May",
        "band": "Queen",
        "style_features": ["orchestral", "harmonic", "layered", "melodic_rock"],
        "signature_techniques": ["harmonies", "coin_picking", "red_special_tone"]
    },
    "eddie_van_halen": {
        "name": "Eddie Van Halen",
        "band": "Van Halen",
        "style_features": ["tapping", "speed", "innovation", "hard_rock"],
        "signature_techniques": ["two_hand_tapping", "harmonics", "dive_bombs", "rhythm_riffs"]
    },
    "tony_iommi": {
        "name": "Tony Iommi",
        "band": "Black Sabbath",
        "style_features": ["heavy_metal", "dark_riffs", "downtuned", "doom"],
        "signature_techniques": ["power_chords", "tritones", "fingertip_prosthetics"]
    },
    "slash": {
        "name": "Slash",
        "band": "Guns N' Roses",
        "style_features": ["blues_rock", "melodic_solos", "les_paul_tone", "emotional"],
        "signature_techniques": ["sustained_bends", "pentatonic_runs", "wah_effects"]
    },
    "angus_young": {
        "name": "Angus Young",
        "band": "AC/DC",
        "style_features": ["hard_rock", "blues_based", "energetic", "power_chords"],
        "signature_techniques": ["vibrato", "pentatonic_licks", "open_chords", "stage_energy"]
    },
    "carlos_santana": {
        "name": "Carlos Santana",
        "band": "Santana",
        "style_features": ["latin_rock", "melodic", "sustained", "spiritual"],
        "signature_techniques": ["sustain", "melodic_phrasing", "latin_rhythms", "harmonic_minor"]
    }
}


@dataclass
class StyleAnalysisResult:
    """스타일 분석 결과"""
    primary_style: str
    confidence: float
    matched_legends: List[Dict[str, Any]]
    detected_techniques: List[Dict[str, Any]]
    style_distribution: Dict[str, float]
    recommendations: List[str]
    harmonic_analysis: Dict[str, Any]
    rhythmic_patterns: List[Dict[str, Any]]


class SpectralFeatureExtractor(nn.Module):
    """스펙트럴 특징 추출기"""
    
    def __init__(self, n_fft: int = 2048, hop_length: int = 512):
        super().__init__()
        self.n_fft = n_fft
        self.hop_length = hop_length
        
        # Mel-spectrogram 설정
        self.mel_scale = torchaudio.transforms.MelSpectrogram(
            sample_rate=44100,
            n_fft=n_fft,
            hop_length=hop_length,
            n_mels=128,
            f_min=80,
            f_max=8000
        )
        
        # MFCC 추출
        self.mfcc = torchaudio.transforms.MFCC(
            sample_rate=44100,
            n_mfcc=40,
            melkwargs={
                'n_fft': n_fft,
                'hop_length': hop_length,
                'n_mels': 128
            }
        )
        
        # Chroma 특징
        self.chroma = torchaudio.transforms.ChromaSpectrogram(
            sample_rate=44100,
            n_fft=n_fft,
            hop_length=hop_length,
            n_chroma=12
        )
        
    def forward(self, audio: torch.Tensor) -> Dict[str, torch.Tensor]:
        """오디오에서 스펙트럴 특징 추출"""
        
        # Mel-spectrogram
        mel_spec = self.mel_scale(audio)
        mel_db = torchaudio.transforms.AmplitudeToDB()(mel_spec)
        
        # MFCC
        mfcc_features = self.mfcc(audio)
        
        # Chroma
        chroma_features = self.chroma(audio)
        
        # Spectral centroid, rolloff, etc.
        spec = torch.stft(
            audio.squeeze(),
            n_fft=self.n_fft,
            hop_length=self.hop_length,
            return_complex=True
        )
        magnitude = torch.abs(spec)
        
        # Spectral centroid
        freqs = torch.linspace(0, 44100/2, magnitude.size(0))
        spectral_centroid = torch.sum(freqs.unsqueeze(-1) * magnitude, dim=0) / torch.sum(magnitude, dim=0)
        
        # Spectral rolloff
        cumsum = torch.cumsum(magnitude, dim=0)
        rolloff_threshold = 0.85 * torch.sum(magnitude, dim=0)
        spectral_rolloff = torch.argmax((cumsum >= rolloff_threshold).float(), dim=0)
        
        # Zero crossing rate
        zcr = torch.sum(torch.abs(torch.diff(torch.sign(audio))) > 0) / audio.size(-1)
        
        return {
            'mel_spectrogram': mel_db,
            'mfcc': mfcc_features,
            'chroma': chroma_features,
            'spectral_centroid': spectral_centroid,
            'spectral_rolloff': spectral_rolloff,
            'zero_crossing_rate': zcr,
            'magnitude_spectrum': magnitude
        }


class TemporalFeatureExtractor(nn.Module):
    """시간적 특징 추출기"""
    
    def __init__(self):
        super().__init__()
        
        # LSTM for temporal modeling
        self.lstm = nn.LSTM(
            input_size=128,
            hidden_size=256,
            num_layers=3,
            batch_first=True,
            dropout=0.3,
            bidirectional=True
        )
        
        # Attention mechanism
        self.attention = nn.MultiheadAttention(
            embed_dim=512,
            num_heads=8,
            dropout=0.1
        )
        
    def forward(self, features: torch.Tensor) -> torch.Tensor:
        """시간적 패턴 모델링"""
        
        # LSTM processing
        lstm_out, (hidden, cell) = self.lstm(features)
        
        # Self-attention
        attn_out, attn_weights = self.attention(
            lstm_out, lstm_out, lstm_out
        )
        
        # Combine LSTM and attention
        combined = lstm_out + attn_out
        
        return combined, attn_weights


class TechniqueDetector(nn.Module):
    """기타 테크닉 감지 모듈"""
    
    def __init__(self, num_techniques: int = 20):
        super().__init__()
        
        self.techniques = [
            'bending', 'vibrato', 'slide', 'hammer_on', 'pull_off',
            'tapping', 'harmonics', 'palm_muting', 'tremolo_picking',
            'sweep_picking', 'alternate_picking', 'hybrid_picking',
            'finger_picking', 'strumming', 'power_chords', 'octaves',
            'double_stops', 'unison_bends', 'wah_effect', 'feedback'
        ]
        
        # CNN for technique detection
        self.conv1 = nn.Conv2d(1, 32, kernel_size=(3, 3), padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=(3, 3), padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=(3, 3), padding=1)
        
        self.pool = nn.MaxPool2d(2, 2)
        self.dropout = nn.Dropout2d(0.25)
        
        # Classification head
        self.fc1 = nn.Linear(128 * 16 * 4, 512)
        self.fc2 = nn.Linear(512, 256)
        self.fc3 = nn.Linear(256, num_techniques)
        
    def forward(self, spectrogram: torch.Tensor) -> torch.Tensor:
        """스펙트로그램에서 테크닉 감지"""
        
        # Add channel dimension if needed
        if spectrogram.dim() == 2:
            spectrogram = spectrogram.unsqueeze(0).unsqueeze(0)
        elif spectrogram.dim() == 3:
            spectrogram = spectrogram.unsqueeze(1)
        
        # Convolutional layers
        x = F.relu(self.conv1(spectrogram))
        x = self.pool(x)
        x = self.dropout(x)
        
        x = F.relu(self.conv2(x))
        x = self.pool(x)
        x = self.dropout(x)
        
        x = F.relu(self.conv3(x))
        x = self.pool(x)
        x = self.dropout(x)
        
        # Flatten and classify
        x = x.view(x.size(0), -1)
        x = F.relu(self.fc1(x))
        x = F.dropout(x, 0.5, self.training)
        x = F.relu(self.fc2(x))
        x = F.dropout(x, 0.5, self.training)
        x = torch.sigmoid(self.fc3(x))  # Multi-label classification
        
        return x


class SpectroFusionNet(nn.Module):
    """
    메인 스타일 분석 네트워크
    스펙트럴, 시간적, 테크닉 특징을 융합하여 스타일 분류
    """
    
    def __init__(self, num_styles: int = 10):
        super().__init__()
        
        self.spectral_extractor = SpectralFeatureExtractor()
        self.temporal_extractor = TemporalFeatureExtractor()
        self.technique_detector = TechniqueDetector()
        
        # Feature fusion layers
        self.fusion_fc1 = nn.Linear(512 + 256 + 20, 1024)
        self.fusion_fc2 = nn.Linear(1024, 512)
        self.fusion_fc3 = nn.Linear(512, 256)
        
        # Style classification head
        self.style_classifier = nn.Linear(256, num_styles)
        
        # Legend matching head
        self.legend_matcher = nn.Linear(256, len(GUITAR_LEGENDS))
        
        # Dropout for regularization
        self.dropout = nn.Dropout(0.3)
        
    def forward(self, audio: torch.Tensor) -> Dict[str, torch.Tensor]:
        """오디오에서 스타일 분석"""
        
        # Extract spectral features
        spectral_features = self.spectral_extractor(audio)
        
        # Process temporal patterns
        mel_spec = spectral_features['mel_spectrogram']
        if mel_spec.dim() == 2:
            mel_spec = mel_spec.unsqueeze(0)
        
        # Reshape for LSTM (batch, time, features)
        mel_reshaped = mel_spec.transpose(1, 2)
        temporal_features, attention_weights = self.temporal_extractor(mel_reshaped)
        
        # Global pooling for temporal features
        temporal_pooled = torch.mean(temporal_features, dim=1)
        
        # Detect techniques
        technique_probs = self.technique_detector(mel_spec)
        
        # Extract global spectral statistics
        spectral_stats = torch.cat([
            torch.mean(spectral_features['mfcc'], dim=-1),
            torch.std(spectral_features['mfcc'], dim=-1),
            spectral_features['spectral_centroid'].mean().unsqueeze(0),
            spectral_features['spectral_rolloff'].float().mean().unsqueeze(0),
            spectral_features['zero_crossing_rate'].unsqueeze(0)
        ])
        
        # Combine all features
        combined_features = torch.cat([
            temporal_pooled.squeeze(),
            spectral_stats,
            technique_probs.squeeze()
        ])
        
        # Fusion network
        x = F.relu(self.fusion_fc1(combined_features))
        x = self.dropout(x)
        x = F.relu(self.fusion_fc2(x))
        x = self.dropout(x)
        fusion_features = F.relu(self.fusion_fc3(x))
        
        # Classification
        style_logits = self.style_classifier(fusion_features)
        style_probs = F.softmax(style_logits, dim=-1)
        
        # Legend matching
        legend_logits = self.legend_matcher(fusion_features)
        legend_probs = F.softmax(legend_logits, dim=-1)
        
        return {
            'style_probabilities': style_probs,
            'legend_probabilities': legend_probs,
            'technique_probabilities': technique_probs,
            'attention_weights': attention_weights,
            'fusion_features': fusion_features
        }


class GuitarStyleAnalyzer:
    """기타 스타일 분석기 메인 클래스"""
    
    def __init__(self, model_path: Optional[Path] = None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = SpectroFusionNet().to(self.device)
        
        if model_path and model_path.exists():
            self.load_model(model_path)
        else:
            logger.info("No pre-trained model found, using random initialization")
        
        self.model.eval()
        
    def load_model(self, model_path: Path):
        """사전 학습된 모델 로드"""
        try:
            checkpoint = torch.load(model_path, map_location=self.device)
            self.model.load_state_dict(checkpoint['model_state_dict'])
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
    
    def analyze_audio(self, audio_path: str, sr: int = 44100) -> StyleAnalysisResult:
        """오디오 파일 분석"""
        
        # Load audio
        audio, orig_sr = librosa.load(audio_path, sr=sr)
        audio_tensor = torch.FloatTensor(audio).unsqueeze(0).to(self.device)
        
        # Run model
        with torch.no_grad():
            outputs = self.model(audio_tensor)
        
        # Process results
        style_probs = outputs['style_probabilities'].cpu().numpy()
        legend_probs = outputs['legend_probabilities'].cpu().numpy()
        technique_probs = outputs['technique_probabilities'].cpu().numpy()
        
        # Get primary style
        style_names = list(GUITAR_LEGENDS.keys())
        primary_style_idx = np.argmax(style_probs)
        primary_style = style_names[primary_style_idx] if primary_style_idx < len(style_names) else "unknown"
        confidence = float(style_probs[primary_style_idx]) if len(style_probs) > 0 else 0.0
        
        # Match legends
        matched_legends = self._match_legends(legend_probs)
        
        # Detect techniques
        detected_techniques = self._detect_techniques(technique_probs, audio, sr)
        
        # Create style distribution
        style_distribution = {
            name: float(prob) for name, prob in zip(style_names, style_probs.flatten())
        }
        
        # Generate recommendations
        recommendations = self._generate_recommendations(
            primary_style, matched_legends, detected_techniques
        )
        
        # Harmonic analysis
        harmonic_analysis = self._analyze_harmony(audio, sr)
        
        # Rhythmic patterns
        rhythmic_patterns = self._analyze_rhythm(audio, sr)
        
        return StyleAnalysisResult(
            primary_style=GUITAR_LEGENDS.get(primary_style, {}).get('name', 'Unknown'),
            confidence=confidence * 100,
            matched_legends=matched_legends,
            detected_techniques=detected_techniques,
            style_distribution=style_distribution,
            recommendations=recommendations,
            harmonic_analysis=harmonic_analysis,
            rhythmic_patterns=rhythmic_patterns
        )
    
    def _match_legends(self, legend_probs: np.ndarray) -> List[Dict[str, Any]]:
        """레전드 매칭"""
        legend_names = list(GUITAR_LEGENDS.keys())
        matches = []
        
        # Get top 3 matches
        top_indices = np.argsort(legend_probs.flatten())[-3:][::-1]
        
        for idx in top_indices:
            if idx < len(legend_names):
                legend_key = legend_names[idx]
                legend_info = GUITAR_LEGENDS[legend_key]
                matches.append({
                    'name': legend_info['name'],
                    'band': legend_info['band'],
                    'similarity': float(legend_probs.flatten()[idx]) * 100,
                    'characteristics': legend_info['style_features'],
                    'techniques': legend_info['signature_techniques']
                })
        
        return matches
    
    def _detect_techniques(self, technique_probs: np.ndarray, audio: np.ndarray, sr: int) -> List[Dict[str, Any]]:
        """테크닉 감지"""
        techniques = []
        technique_names = [
            'bending', 'vibrato', 'slide', 'hammer_on', 'pull_off',
            'tapping', 'harmonics', 'palm_muting', 'tremolo_picking',
            'sweep_picking', 'alternate_picking', 'hybrid_picking',
            'finger_picking', 'strumming', 'power_chords', 'octaves',
            'double_stops', 'unison_bends', 'wah_effect', 'feedback'
        ]
        
        # Get detected techniques (threshold > 0.5)
        detected_indices = np.where(technique_probs.flatten() > 0.5)[0]
        
        for idx in detected_indices:
            if idx < len(technique_names):
                techniques.append({
                    'name': technique_names[idx],
                    'confidence': float(technique_probs.flatten()[idx]) * 100,
                    'timestamp': 0,  # Would need onset detection for accurate timestamps
                    'duration': 0
                })
        
        return techniques
    
    def _analyze_harmony(self, audio: np.ndarray, sr: int) -> Dict[str, Any]:
        """화성 분석"""
        # Chroma features
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)
        
        # Key detection
        chroma_mean = np.mean(chroma, axis=1)
        key_idx = np.argmax(chroma_mean)
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        detected_key = keys[key_idx]
        
        # Chord progression analysis (simplified)
        return {
            'key': detected_key,
            'mode': 'major',  # Would need more sophisticated analysis
            'chord_progression': ['I', 'IV', 'V'],  # Placeholder
            'harmonic_rhythm': 'moderate'
        }
    
    def _analyze_rhythm(self, audio: np.ndarray, sr: int) -> List[Dict[str, Any]]:
        """리듬 패턴 분석"""
        # Tempo detection
        tempo, beats = librosa.beat.beat_track(y=audio, sr=sr)
        
        # Onset detection
        onset_envelope = librosa.onset.onset_strength(y=audio, sr=sr)
        
        return [{
            'tempo': float(tempo),
            'time_signature': '4/4',  # Would need more analysis
            'groove': 'straight',  # vs 'swing'
            'intensity': float(np.mean(onset_envelope))
        }]
    
    def _generate_recommendations(
        self, 
        primary_style: str, 
        matched_legends: List[Dict], 
        techniques: List[Dict]
    ) -> List[str]:
        """학습 추천 생성"""
        recommendations = []
        
        if matched_legends:
            top_legend = matched_legends[0]
            recommendations.append(
                f"{top_legend['name']}의 스타일과 {top_legend['similarity']:.1f}% 유사합니다. "
                f"해당 아티스트의 대표곡을 연습해보세요."
            )
        
        # Technique recommendations
        if not any(t['name'] == 'bending' for t in techniques):
            recommendations.append("벤딩 테크닉을 더 연습하면 표현력이 향상됩니다.")
        
        if not any(t['name'] == 'vibrato' for t in techniques):
            recommendations.append("비브라토를 추가하여 음의 지속감을 높여보세요.")
        
        # Style-specific recommendations
        if primary_style in GUITAR_LEGENDS:
            legend = GUITAR_LEGENDS[primary_style]
            for technique in legend['signature_techniques'][:2]:
                recommendations.append(f"{technique} 테크닉을 마스터하면 더 authentic한 사운드를 만들 수 있습니다.")
        
        return recommendations[:5]  # Return top 5 recommendations


# FastAPI 통합을 위한 서비스 클래스
class StyleAnalysisService:
    """FastAPI와 통합되는 서비스 클래스"""
    
    def __init__(self):
        self.analyzer = GuitarStyleAnalyzer()
    
    async def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """파일 분석 (비동기)"""
        try:
            result = self.analyzer.analyze_audio(file_path)
            
            return {
                'success': True,
                'analysis': {
                    'primary_style': result.primary_style,
                    'confidence': result.confidence,
                    'matched_legends': result.matched_legends,
                    'techniques': result.detected_techniques,
                    'style_distribution': result.style_distribution,
                    'recommendations': result.recommendations,
                    'harmonic_analysis': result.harmonic_analysis,
                    'rhythmic_patterns': result.rhythmic_patterns
                }
            }
        except Exception as e:
            logger.error(f"Style analysis failed: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def analyze_midi(self, midi_path: str) -> Dict[str, Any]:
        """MIDI 파일 분석"""
        # MIDI to audio synthesis would be needed
        # For now, return placeholder
        return {
            'success': True,
            'analysis': {
                'primary_style': 'Rock',
                'confidence': 85.0,
                'matched_legends': [],
                'techniques': [],
                'recommendations': ["MIDI 분석은 오디오 변환 후 진행됩니다."]
            }
        }


# 모델 학습 함수 (필요시 사용)
def train_model(
    train_loader: torch.utils.data.DataLoader,
    val_loader: torch.utils.data.DataLoader,
    num_epochs: int = 100,
    learning_rate: float = 0.001
):
    """모델 학습"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = SpectroFusionNet().to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', patience=5
    )
    
    best_val_loss = float('inf')
    
    for epoch in range(num_epochs):
        # Training
        model.train()
        train_loss = 0.0
        
        for batch_idx, (audio, labels) in enumerate(train_loader):
            audio, labels = audio.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(audio)
            
            loss = criterion(outputs['style_probabilities'], labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        
        # Validation
        model.eval()
        val_loss = 0.0
        
        with torch.no_grad():
            for audio, labels in val_loader:
                audio, labels = audio.to(device), labels.to(device)
                outputs = model(audio)
                loss = criterion(outputs['style_probabilities'], labels)
                val_loss += loss.item()
        
        avg_train_loss = train_loss / len(train_loader)
        avg_val_loss = val_loss / len(val_loader)
        
        scheduler.step(avg_val_loss)
        
        logger.info(
            f"Epoch {epoch+1}/{num_epochs} - "
            f"Train Loss: {avg_train_loss:.4f}, "
            f"Val Loss: {avg_val_loss:.4f}"
        )
        
        # Save best model
        if avg_val_loss < best_val_loss:
            best_val_loss = avg_val_loss
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'loss': best_val_loss
            }, 'spectrofusion_best.pth')
    
    return model


if __name__ == "__main__":
    # 테스트
    analyzer = GuitarStyleAnalyzer()
    print("SpectroFusionNet Guitar Style Analyzer initialized")
    print(f"Available legends: {list(GUITAR_LEGENDS.keys())}")