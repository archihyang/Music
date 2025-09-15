<script lang="ts">
  import type { TheoryAnalysis } from '../../app';
  
  export let analysis: TheoryAnalysis | undefined;
  
  // 로마 숫자 색상 매핑
  const romanNumeralColors: Record<string, string> = {
    'I': 'text-green-400',
    'ii': 'text-blue-400',
    'iii': 'text-purple-400',
    'IV': 'text-yellow-400',
    'V': 'text-red-400',
    'vi': 'text-orange-400',
    'vii°': 'text-gray-400'
  };
  
  function getColorForRomanNumeral(numeral: string): string {
    const base = numeral.replace(/[^IVvi°]/g, '');
    return romanNumeralColors[base] || 'text-gray-300';
  }
</script>

<div class="theory-analyzer">
  {#if analysis}
    <!-- 기본 정보 -->
    <div class="analysis-section">
      <h4 class="font-semibold mb-2">조성 분석</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-gray-400">조성:</span>
          <span class="font-mono ml-2">{analysis.key}</span>
        </div>
        <div>
          <span class="text-gray-400">모드:</span>
          <span class="font-mono ml-2">{analysis.mode}</span>
        </div>
      </div>
    </div>
    
    <!-- 코드 진행 -->
    {#if analysis.chordProgression && analysis.chordProgression.length > 0}
      <div class="analysis-section">
        <h4 class="font-semibold mb-2">코드 진행</h4>
        <div class="chord-progression">
          {#each analysis.chordProgression as chord, i}
            <div class="chord-symbol">
              <span class="chord-name">{chord.root}{chord.quality}</span>
              {#if analysis.romanNumerals && analysis.romanNumerals[i]}
                <span class="roman-numeral {getColorForRomanNumeral(analysis.romanNumerals[i])}">
                  {analysis.romanNumerals[i]}
                </span>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Modal Interchange -->
    {#if analysis.modalInterchanges && analysis.modalInterchanges.length > 0}
      <div class="analysis-section">
        <h4 class="font-semibold mb-2">Modal Interchange</h4>
        <div class="space-y-1">
          {#each analysis.modalInterchanges as mi}
            <div class="text-sm">
              <span class="font-mono text-yellow-400">{mi.chord}</span>
              <span class="text-gray-400">← {mi.borrowedFrom}</span>
              <span class="text-xs text-gray-500">(마디 {mi.measure})</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Secondary Dominants -->
    {#if analysis.secondaryDominants && analysis.secondaryDominants.length > 0}
      <div class="analysis-section">
        <h4 class="font-semibold mb-2">Secondary Dominants</h4>
        <div class="space-y-1">
          {#each analysis.secondaryDominants as sd}
            <div class="text-sm">
              <span class="font-mono text-red-400">{sd.chord}</span>
              <span class="text-gray-400">→ {sd.targetChord}</span>
              <span class="text-xs text-gray-500">(마디 {sd.measure})</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {:else}
    <div class="empty-state">
      <p class="text-gray-400">이론 분석 대기 중...</p>
    </div>
  {/if}
</div>

<style>
  .theory-analyzer {
    min-height: 300px;
  }
  
  .analysis-section {
    background-color: #1f2937;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .analysis-section:last-child {
    margin-bottom: 0;
  }
  
  .chord-progression {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }
  
  .chord-symbol {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.5rem;
    background-color: #374151;
    border-radius: 0.25rem;
  }
  
  .chord-name {
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .roman-numeral {
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem;
  }
</style>
