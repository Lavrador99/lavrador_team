import styled from 'styled-components';

export const PageWrapper = styled.div`
  padding: 40px 32px;
  max-width: 1200px;
`;

export const PageHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
`;

export const PageTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: #e8e8f0;
`;

export const PageSubtitle = styled.p`
  font-size: 13px;
  color: #666677;
  margin-top: 4px;
  font-family: 'DM Mono', monospace;
`;

export const FiltersBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 28px;
  align-items: center;
`;

export const SearchInput = styled.input`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 14px;
  color: #e8e8f0;
  font-size: 13px;
  outline: none;
  width: 220px;
  transition: border-color 0.2s;
  font-family: 'DM Sans', sans-serif;

  &:focus { border-color: #c8f542; }
  &::placeholder { color: #444455; }
`;

export const FilterSelect = styled.select`
  background: #18181f;
  border: 1px solid #2a2a35;
  border-radius: 6px;
  padding: 10px 14px;
  color: #e8e8f0;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  font-family: 'DM Sans', sans-serif;
  transition: border-color 0.2s;

  &:focus { border-color: #c8f542; }
  option { background: #18181f; }
`;

export const ClearBtn = styled.button`
  background: transparent;
  border: 1px solid #2a2a35;
  color: #666677;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-family: 'DM Mono', monospace;
  transition: all 0.2s;
  &:hover { border-color: #666677; color: #e8e8f0; }
`;

export const ResultCount = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 11px;
  color: #666677;
  margin-left: auto;
`;

export const ExerciseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`;

export const ExerciseCard = styled.div<{ $active?: boolean }>`
  background: #111118;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(200,245,66,0.5)' : '#2a2a35')};
  border-radius: 10px;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  box-shadow: ${({ $active }) => ($active ? '0 0 0 1px rgba(200,245,66,0.2)' : 'none')};

  &:hover {
    border-color: rgba(200, 245, 66, 0.3);
    transform: translateY(-2px);
  }
`;

export const CardGif = styled.div<{ $url?: string }>`
  height: 140px;
  background: #18181f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #2a2a35;
  ${({ $url }) => $url && `
    background-image: url(${$url});
    background-size: cover;
    background-position: center;
  `}
`;

export const CardBody = styled.div`
  padding: 14px 16px;
`;

export const CardName = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #e8e8f0;
  margin-bottom: 8px;
  line-height: 1.3;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
`;

export const Tag = styled.span<{ $variant?: 'pattern' | 'level' | 'muscle' | 'equip' }>`
  font-family: 'DM Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 3px 8px;
  border-radius: 3px;

  ${({ $variant }) => {
    switch ($variant) {
      case 'pattern': return 'background: rgba(200,245,66,0.08); border: 1px solid rgba(200,245,66,0.2); color: #c8f542;';
      case 'level': return 'background: rgba(66,165,245,0.08); border: 1px solid rgba(66,165,245,0.2); color: #42a5f5;';
      case 'muscle': return 'background: rgba(255,107,53,0.08); border: 1px solid rgba(255,107,53,0.2); color: #ff8c5a;';
      case 'equip': return 'background: rgba(42,42,53,0.8); border: 1px solid #2a2a35; color: #888899;';
      default: return 'background: #18181f; border: 1px solid #2a2a35; color: #666677;';
    }
  }}
`;

export const ClinicalFlag = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: #ff8c5a;
  font-family: 'DM Mono', monospace;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #2a2a35;
`;

export const EmptyState = styled.div`
  grid-column: 1 / -1;
  text-align: center;
  padding: 64px 24px;
  color: #666677;
  font-family: 'DM Mono', monospace;
  font-size: 13px;
`;

export const LoadingGrid = styled.div`
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: #666677;
  font-family: 'DM Mono', monospace;
`;
