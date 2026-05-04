import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  where, orderBy, deleteDoc, doc, serverTimestamp, limit 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase 配置 ---
const firebaseConfig = {
  apiKey: "AIzaSyCC4_Riq1n3F74ufKWuILbvSYmt0QteiUU",
  authDomain: "farm-record-44d43.firebaseapp.com",
  projectId: "farm-record-44d43",
  storageBucket: "farm-record-44d43.firebasestorage.app",
  messagingSenderId: "928731119811",
  appId: "1:928731119811:web:f054e82b82906b470d6276"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 內聯樣式 ---
const styles = {
  container: {
    fontFamily: '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif',
    backgroundColor: '#f8faf8',
    minHeight: '100vh',
    color: '#2d3436',
    paddingBottom: '40px'
  },
  nav: {
    backgroundColor: '#1b5e20',
    padding: '0 20px',
    height: '64px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  brand: {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  navLinks: {
    display: 'flex',
    gap: '15px'
  },
  navButton: (active) => ({
    color: active ? '#fff' : '#a5d6a7',
    background: 'none',
    border: 'none',
    padding: '8px 4px',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: active ? '600' : '400',
    borderBottom: active ? '3px solid #fff' : '3px solid transparent',
    transition: 'all 0.3s'
  }),
  dashboard: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  statCard: (bg) => ({
    backgroundColor: bg,
    padding: '15px',
    borderRadius: '12px',
    color: '#fff',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    textAlign: 'center'
  }),
  content: {
    padding: '20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
    border: '1px solid #edf2ed'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    margin: '8px 0',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box'
  },
  button: (variant = 'primary') => ({
    backgroundColor: variant === 'primary' ? '#43a047' : (variant === 'danger' ? '#e53935' : '#757575'),
    color: 'white',
    padding: '12px 24px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'opacity 0.2s'
  }),
  toast: {
    position: 'fixed',
    top: '80px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#2e7d32',
    color: 'white',
    padding: '12px 30px',
    borderRadius: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: 2000,
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3000,
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('crops'); 
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState('');

  // 初始化
  useEffect(() => {
    signInAnonymously(auth).catch(err => showToast("認證失敗: " + err.message));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchData(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchData = async (uid) => {
    setLoading(true);
    try {
      const qCrops = query(collection(db, "crops"), where("uid", "==", uid), orderBy("createdAt", "desc"));
      const cropSnap = await getDocs(qCrops);
      const cropList = cropSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrops(cropList);

      const qRecords = query(collection(db, "records"), where("uid", "==", uid), orderBy("date", "desc"));
      const recordSnap = await getDocs(qRecords);
      const recordList = recordSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecords(recordList);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // 統計數據計算
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = lastWeek.toISOString().split('T')[0];

    return {
      totalCrops: crops.length,
      todayRecords: records.filter(r => r.date === today).length,
      weekRecords: records.filter(r => r.date >= lastWeekStr).length
    };
  }, [crops, records]);

  // --- 子組件：載入遮罩 ---
  const Loading = () => (
    <div style={styles.loadingOverlay}>
      <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4caf50', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ marginTop: '15px', color: '#1b5e20', fontWeight: 'bold' }}>載入中...</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // --- 頁面 1：作物管理 ---
  const CropPage = () => {
    const [form, setForm] = useState({ name: '', variety: '', plantDate: '' });

    const handleAdd = async (e) => {
      e.preventDefault();
      if (!form.name || !form.plantDate) return showToast('請填寫完整資訊');
      setLoading(true);
      await addDoc(collection(db, "crops"), { ...form, uid: user.uid, createdAt: serverTimestamp() });
      setForm({ name: '', variety: '', plantDate: '' });
      await fetchData(user.uid);
      showToast('作物已新增');
    };

    const handleDelete = async (id) => {
      if (!confirm("確定刪除作物？相關紀錄將保留但不再連結。")) return;
      setLoading(true);
      await deleteDoc(doc(db, "crops", id));
      await fetchData(user.uid);
      showToast('作物已刪除');
    };

    return (
      <div>
        <div style={styles.dashboard}>
          <div style={styles.statCard('#4caf50')}>
            <div style={{fontSize: '0.8rem'}}>作物總數</div>
            <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>{stats.totalCrops}</div>
          </div>
          <div style={styles.statCard('#388e3c')}>
            <div style={{fontSize: '0.8rem'}}>今日農事</div>
            <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>{stats.todayRecords}</div>
          </div>
          <div style={styles.statCard('#1b5e20')}>
            <div style={{fontSize: '0.8rem'}}>本週累計</div>
            <div style={{fontSize: '1.8rem', fontWeight: 'bold'}}>{stats.weekRecords}</div>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{margin: '0 0 15px 0', color: '#1b5e20'}}>🌱 新增作物栽種</h3>
          <form onSubmit={handleAdd}>
            <input style={styles.input} placeholder="作物名稱 (如：水果玉米)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input style={styles.input} placeholder="品種 (如：華珍)" value={form.variety} onChange={e => setForm({...form, variety: e.target.value})} />
            <div style={{fontSize: '0.8rem', color: '#666', marginTop: '5px'}}>栽種日期</div>
            <input style={styles.input} type="date" value={form.plantDate} onChange={e => setForm({...form, plantDate: e.target.value})} />
            <button style={styles.button()} type="submit">確認新增</button>
          </form>
        </div>

        {crops.map(crop => (
          <div key={crop.id} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px'}}>
            <div>
              <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{crop.name}</div>
              <div style={{fontSize: '0.85rem', color: '#666', marginTop: '4px'}}>
                {crop.variety && `品種: ${crop.variety} | `} 栽種於: {crop.plantDate}
              </div>
            </div>
            <button onClick={() => handleDelete(crop.id)} style={{background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', fontSize: '0.9rem'}}>刪除</button>
          </div>
        ))}
      </div>
    );
  };

  // --- 頁面 2：農事登記 ---
  const WorkPage = () => {
    const [selectedCrops, setSelectedCrops] = useState([]);
    const [work, setWork] = useState({ taskType: '澆水', date: new Date().toISOString().split('T')[0], note: '' });

    const toggleAll = () => {
      if (selectedCrops.length === crops.length) setSelectedCrops([]);
      else setSelectedCrops(crops.map(c => c.id));
    };

    const handleSave = async () => {
      if (selectedCrops.length === 0) return showToast('請選擇作物');
      setLoading(true);
      const batchPromises = selectedCrops.map(cropId => {
        const crop = crops.find(c => c.id === cropId);
        return addDoc(collection(db, "records"), {
          cropId, cropName: crop.name, ...work, uid: user.uid, createdAt: serverTimestamp()
        });
      });
      await Promise.all(batchPromises);
      showToast(`已成功記錄 ${selectedCrops.length} 筆農事`);
      setSelectedCrops([]);
      setWork({ ...work, note: '' });
      await fetchData(user.uid);
      setView('history');
    };

    return (
      <div style={styles.card}>
        <h3 style={{margin: '0 0 10px 0', color: '#1b5e20'}}>📝 批次農事登記</h3>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
          <span style={{fontSize: '0.9rem', color: '#666'}}>選擇作物 (已選 {selectedCrops.length})：</span>
          <button onClick={toggleAll} style={{padding: '4px 10px', borderRadius: '6px', border: '1px solid #4caf50', background: 'none', color: '#4caf50', cursor: 'pointer', fontSize: '0.8rem'}}>
            {selectedCrops.length === crops.length ? '取消全選' : '全選作物'}
          </button>
        </div>

        <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px'}}>
          {crops.map(c => (
            <div key={c.id} onClick={() => {
              if (selectedCrops.includes(c.id)) setSelectedCrops(selectedCrops.filter(id => id !== c.id));
              else setSelectedCrops([...selectedCrops, c.id]);
            }} style={{
              padding: '8px 15px', borderRadius: '20px', border: '1px solid #4caf50', cursor: 'pointer', fontSize: '0.9rem',
              backgroundColor: selectedCrops.includes(c.id) ? '#4caf50' : '#fff',
              color: selectedCrops.includes(c.id) ? '#fff' : '#4caf50',
            }}>
              {c.name}
            </div>
          ))}
          {crops.length === 0 && <p style={{color: '#e53935', fontSize: '0.9rem'}}>請先至「作物管理」新增資料</p>}
        </div>

        <label style={{fontSize: '0.85rem', color: '#666'}}>作業類型</label>
        <select style={styles.input} value={work.taskType} onChange={e => setWork({...work, taskType: e.target.value})}>
          {['施肥', '澆水', '噴藥', '整枝', '採收'].map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{fontSize: '0.85rem', color: '#666'}}>作業日期</label>
        <input style={styles.input} type="date" value={work.date} onChange={e => setWork({...work, date: e.target.value})} />

        <label style={{fontSize: '0.85rem', color: '#666'}}>工作備註</label>
        <textarea style={{...styles.input, height: '80px', resize: 'none'}} placeholder="輸入細節..." value={work.note} onChange={e => setWork({...work, note: e.target.value})} />
        
        <button style={styles.button(crops.length > 0 ? 'primary' : 'disabled')} disabled={crops.length === 0} onClick={handleSave}>儲存紀錄</button>
      </div>
    );
  };

  // --- 頁面 3：查詢紀錄 ---
  const HistoryPage = () => {
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const filteredRecords = records.filter(r => {
      const matchName = r.cropName.includes(search);
      const matchStart = startDate ? r.date >= startDate : true;
      const matchEnd = endDate ? r.date <= endDate : true;
      return matchName && matchStart && matchEnd;
    });

    const handleDeleteRecord = async (id) => {
      if (!confirm("確定刪除此筆紀錄？")) return;
      setLoading(true);
      await deleteDoc(doc(db, "records", id));
      await fetchData(user.uid);
      showToast('紀錄已刪除');
    };

    return (
      <div>
        <div style={styles.card}>
          <h3 style={{margin: '0 0 15px 0', fontSize: '1rem', color: '#1b5e20'}}>🔍 篩選紀錄</h3>
          <input style={styles.input} placeholder="搜尋作物名稱..." value={search} onChange={e => setSearch(e.target.value)} />
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px'}}>
            <div>
              <div style={{fontSize: '0.75rem', color: '#888'}}>起始日期</div>
              <input style={{...styles.input, margin: '4px 0'}} type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <div style={{fontSize: '0.75rem', color: '#888'}}>結束日期</div>
              <input style={{...styles.input, margin: '4px 0'}} type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          {(startDate || endDate || search) && (
            <button onClick={() => {setSearch(''); setStartDate(''); setEndDate('');}} style={{...styles.button('secondary'), marginTop: '15px', padding: '8px'}}>清除篩選</button>
          )}
        </div>

        {filteredRecords.map(rec => (
          <div key={rec.id} style={{...styles.card, padding: '16px 20px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
              <div>
                <span style={{fontSize: '0.8rem', color: '#666'}}>{rec.date}</span>
                <div style={{fontSize: '1.1rem', fontWeight: 'bold', marginTop: '2px'}}>{rec.cropName}</div>
              </div>
              <span style={{
                padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600',
                backgroundColor: '#e8f5e9', color: '#2e7d32'
              }}>{rec.taskType}</span>
            </div>
            <div style={{marginTop: '12px', fontSize: '0.9rem', color: '#444', borderTop: '1px dashed #eee', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
              <div style={{flex: 1, marginRight: '10px'}}>{rec.note || <span style={{color: '#ccc'}}>無備註</span>}</div>
              <button onClick={() => handleDeleteRecord(rec.id)} style={{color: '#e53935', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer'}}>刪除</button>
            </div>
          </div>
        ))}
        {filteredRecords.length === 0 && <p style={{textAlign: 'center', color: '#999', marginTop: '40px'}}>找不到符合條件的紀錄</p>}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {loading && <Loading />}
      {toast && <div style={styles.toast}>{toast}</div>}
      
      <nav style={styles.nav}>
        <div style={styles.brand}>🌾 農場工作紀錄</div>
        <div style={styles.navLinks}>
          <button style={styles.navButton(view === 'crops')} onClick={() => setView('crops')}>作物</button>
          <button style={styles.navButton(view === 'work')} onClick={() => setView('work')}>登記</button>
          <button style={styles.navButton(view === 'history')} onClick={() => setView('history')}>查詢</button>
        </div>
      </nav>

      <main style={styles.content}>
        {view === 'crops' && <CropPage />}
        {view === 'work' && <WorkPage />}
        {view === 'history' && <HistoryPage />}
      </main>

      <footer style={{textAlign: 'center', padding: '20px', color: '#bdbdbd', fontSize: '0.75rem'}}>
        Smart Farm Management v2.0
      </footer>
    </div>
  );
}
