import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { heritageData, HeritageItem } from '../data/heritage';

export default function ItemDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const item = heritageData.find((i: HeritageItem) => i.id === id);

  if (!item) {
    return (
      <div className="turathi-custom-ui" style={{ paddingTop: '120px', textAlign: 'center' }}>
        <h2>العنصر غير موجود.</h2>
        <button onClick={() => navigate('/explore')} className="turathi-primary-btn" style={{ marginTop: '20px' }}>
          العودة للمجموعة
        </button>
      </div>
    );
  }

  return (
    <div className="turathi-custom-ui" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="turathi-details-wrapper">
        
        <Link to="/explore" className="turathi-back-btn">
          <span>&rarr;</span> العودة للمجموعة التقنية
        </Link>

        <div className="turathi-details-grid">
          <div className="turathi-details-img-container">
             <img src={item.imageUrl} alt={item.name} className="turathi-details-img" />
          </div>
          
          <div className="turathi-details-content">
            <div className="turathi-details-tags">
              <span className="turathi-tag">📍 {item.city}</span>
              <span className="turathi-tag bg-opacity">{item.category}</span>
            </div>

            <h1 className="turathi-details-title">{item.name}</h1>
            
            <p className="turathi-details-text">
              {item.longDescription}
            </p>

            {item.aiInsight && (
              <div className="turathi-ai-insight">
                <div className="turathi-ai-insight-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z"></path>
                    <path d="M12 12 2.1 7.1"></path>
                    <path d="M12 12l9.9 4.9"></path>
                  </svg>
                  <span>التحليل المعرفي (AI)</span>
                </div>
                <p>{item.aiInsight}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
