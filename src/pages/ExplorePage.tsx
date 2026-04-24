import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import HeritageCard from '../components/HeritageCard';
import { Button, EmptyState, Section } from '../components/ui';
import { heritageData, HeritageItem } from '../data/heritage';

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('الكل');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const cities = useMemo(() => ['الكل', ...new Set(heritageData.map((item) => item.city))], []);
  const categories = useMemo(() => ['الكل', ...new Set(heritageData.map((item) => item.category))], []);

  const filteredItems = heritageData.filter((item: HeritageItem) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      item.name.toLowerCase().includes(normalizedSearch) ||
      item.description.toLowerCase().includes(normalizedSearch) ||
      item.city.toLowerCase().includes(normalizedSearch) ||
      item.category.toLowerCase().includes(normalizedSearch);
    const matchesCity = selectedCity === 'الكل' || item.city === selectedCity;
    const matchesCategory = selectedCategory === 'الكل' || item.category === selectedCategory;

    return matchesSearch && matchesCity && matchesCategory;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCity('الكل');
    setSelectedCategory('الكل');
  };

  return (
    <div className="page-shell">
      <Section
        compact
        eyebrow={
          <>
            <SlidersHorizontal size={15} aria-hidden="true" />
            أرشيف قابل للاستكشاف
          </>
        }
        title="المجموعة التراثية"
        subtitle="تصفح أرشيفاً رقمياً مختاراً للحرف، الأزياء، والمنسوجات الفلسطينية مع صور موحدة ومساحات قراءة مريحة."
      >
        <div className="turathi-filters-bar">
          <label className="relative">
            <span className="sr-only">ابحث في المجموعة التراثية</span>
            <input
              type="text"
              placeholder="ابحث عن ثوب، حرفة، مدينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="turathi-input"
            />
            <Search
              size={18}
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
          </label>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="turathi-select"
            aria-label="تصفية حسب المدينة"
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="turathi-select"
            aria-label="تصفية حسب التصنيف"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5 text-sm font-bold text-text-muted">
          <span>عدد النتائج: {filteredItems.length}</span>
          {(searchQuery || selectedCity !== 'الكل' || selectedCategory !== 'الكل') && (
            <Button variant="subtle" size="sm" icon={<X size={16} aria-hidden="true" />} onClick={resetFilters}>
              مسح التصفية
            </Button>
          )}
        </div>

        {filteredItems.length > 0 ? (
          <div className="turathi-grid">
            {filteredItems.map((item) => (
              <HeritageCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="لا توجد نتائج مطابقة"
            description="جرّب كلمة بحث أعم أو امسح التصفية للعودة إلى المجموعة الكاملة."
            action={
              <Button variant="primary" onClick={resetFilters}>
                عرض كل العناصر
              </Button>
            }
          />
        )}
      </Section>
    </div>
  );
}
