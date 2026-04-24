import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { heritageData, HeritageItem } from '../data/heritage';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');

  const cities = ['الكل', ...new Set(heritageData.map(item => item.city))];

  const filteredItems = heritageData.filter((item: HeritageItem) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.includes(searchQuery);
    const matchesCity = selectedCity === 'الكل' || item.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="turathi-custom-ui" style={{ paddingTop: '80px' }}>
      <div className="turathi-container" style={{ paddingBottom: '60px' }}>
        
        <div className="turathi-section-header" style={{ marginTop: '40px' }}>
          <h2>المجموعة التراثية</h2>
          <p>تصفح أرشيفنا الرقمي الشامل للتراث، الحرف، والأزياء الفلسطينية العريقة.</p>
        </div>

        {/* Filters */}
        <div className="turathi-filters-bar">
          <input 
            type="text" 
            placeholder="ابحث عن ثوب، حرفة، مدينة..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="turathi-input"
          />
          <select 
            value={selectedCity} 
            onChange={(e) => setSelectedCity(e.target.value)}
            className="turathi-select"
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Grid */}
        <div className="turathi-grid">
          {filteredItems.map((item) => (
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

        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#7f8c8d' }}>
            <h3>لم يتم العثور على أية نتائج مطابقة لبحثك.</h3>
          </div>
        )}

      </div>
    </div>
  );
}
