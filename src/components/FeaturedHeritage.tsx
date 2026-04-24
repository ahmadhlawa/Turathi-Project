import React from 'react';
import { Link } from 'react-router-dom';
import { heritageData } from '../data/heritage';

export default function FeaturedHeritage() {
  // Taking top 3 items for featured block
  const featured = heritageData.slice(0, 3);

  return (
    <section className="turathi-custom-ui" style={{ padding: '60px 0' }}>
      <div className="turathi-container">
        
        <div className="turathi-section-header">
          <h2>مجموعة التراث البارزة</h2>
          <p>اكتشف أصالة التراث الفلسطيني من خلال مجموعة مختارة من الحرف والأزياء.</p>
        </div>

        <div className="turathi-grid">
          {featured.map((item) => (
            <Link to={`/explore/${item.id}`} key={item.id} className="turathi-card">
              <div className="turathi-card-img-wrapper">
                <img src={item.imageUrl} alt={item.name} className="turathi-card-img" />
                <div className="turathi-card-city-badge">
                  <span>📍</span> {item.city}
                </div>
              </div>
              <div className="turathi-card-body">
                <span className="turathi-card-category">{item.category}</span>
                <h3 className="turathi-card-title">{item.name}</h3>
                <p className="turathi-card-desc">{item.description}</p>
                
                <div className="turathi-card-footer">
                  <span className="turathi-link-text">اكتشف التفاصيل ←</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <Link to="/explore" className="turathi-primary-btn">
            تصفح المجموعة الكاملة
          </Link>
        </div>

      </div>
    </section>
  );
}
