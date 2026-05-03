import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  where, orderBy, deleteDoc, doc, serverTimestamp 
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

// --- 樣式設定 ---
const styles = {
  container: {
    fontFamily: '"PingFang TC", "Heiti TC", "Microsoft JhengHei", sans-serif',
    backgroundColor: '#f0f4f0',
    minHeight: '100vh',
    color: '#333',
  },
  nav: {
    backgroundColor: '#2e7d32',
    padding: '1rem',
    display: 'flex',
    justifyContent: 'space-around',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  navButton: (active) => ({
    color: '#fff',
    textDecoration: 'none',
    fontSize: '1rem',
    fontWeight: active ? 'bold' : 'normal',
    borderBottom: active ? '2px solid #fff' : 'none',
    padding: '5px 10px',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  }),
  content: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  input: {
    width: '100%',
    padding: '12px',
    margin: '8px 0',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
  },
  button: {
    backgroundColor: '#4caf50',
    color: 'white',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '10px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    marginRight: '5px',
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: '50px',
  }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('crops'); // 'crops', 'work', 'history'
  const [loading, setLoading] = useState(true);
  const [crops, setCrops] = useState([]);
  const [records, setRecords] = useState([]);

  // 初始化匿名登入
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        fetchData(u.uid);
      }
    });
  }, []);

  const fetchData = async (uid) => {
    setLoading(true);
    try {
      const qCrops = query(collection(db, "crops"), where("uid", "==", uid));
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

  // --- 子組件 ---

  const Loading = () => (
    <div style={styles.loadingOverlay}>
      <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #4caf50', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      <p style={{ marginTop: '10px', color: '#2e7d32', fontWeight: 'bold' }}>讀取中...</p>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const CropPage = () => {
    const [form, setForm] = useState({ name: '', variety: '', plantDate: '' });

    const handleAdd = async (e) => {
      e.preventDefault();
      if (!form.name || !form.plantDate) return alert('請填寫完整資訊');
      setLoading(true);
      await addDoc(collection(db, "crops"), { ...form, uid: user.uid, createdAt: serverTimestamp() });
      setForm({ name: '', variety: '', plantDate: '' });
      await fetchData(user.uid);
    };

    const handleDelete = async (id) => {
      if (!window.confirm("確定要刪除此作物？")) return;
      setLoading(true);
      await deleteDoc(doc(db, "crops", id));
      await fetchData(user.uid);
    };

    return (
      <div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>🌱 新增作物</h3>
          <form onSubmit={handleAdd}>
            <input style={styles.input} placeholder="作物名稱 (例: 番茄)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input style={styles.input} placeholder="品種 (例: 聖女)" value={form.variety} onChange={e => setForm({...form, variety: e.target.value})} />
            <input style={styles.input} type="date" value={form.plantDate} onChange={e => setForm({...form, plantDate: e.target.value})} />
            <button style={styles.button} type="submit">確認新增</button>
          </form>
        </div>
        {crops.length === 0 ? <p style={styles.emptyText}>目前沒有作物，請先新增。</p> : 
          crops.map(crop => (
            <div key={crop.id} style={{...styles.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <strong style={{fontSize: '1.2rem'}}>{crop.name}</strong>
                <div style={{color: '#666', fontSize: '0.9rem', marginTop: '5px'}}>
                  品種：{crop.variety || '未填'} | 栽種日：{crop.plantDate}
                </div>
              </div>
              <button onClick={() => handleDelete(crop.id)} style={{background: '#ffebee', color: '#c62828', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer'}}>刪除</button>
            </div>
          ))
        }
      </div>
    );
  };

  const WorkPage = () => {
    const [selectedCrops, setSelectedCrops] = useState([]);
    const [work, setWork] = useState({ taskType: '澆水', date: new Date().toISOString().split('T')[0], note: '' });

    const handleSave = async () => {
      if (selectedCrops.length === 0) return alert('請至少選擇一個作物');
      setLoading(true);
      const batchPromises = selectedCrops.map(cropId => {
        const crop = crops.find(c => c.id === cropId);
        return addDoc(collection(db, "records"), {
          cropId,
          cropName: crop.name,
          ...work,
          uid: user.uid,
          createdAt: serverTimestamp()
        });
      });
      await Promise.all(batchPromises);
      alert('紀錄已儲存');
      setSelectedCrops([]);
      setWork({ ...work, note: '' });
      await fetchData(user.uid);
      setView('history');
    };

    return (
      <div>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>📝 登記農事</h3>
          <p style={{fontSize: '0.9rem', color: '#666'}}>1. 選擇作物 (可多選)：</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px'}}>
            {crops.map(c => (
              <label key={c.id} style={{
                padding: '8px 12px', borderRadius: '20px', border: '1px solid #4caf50', cursor: 'pointer',
                backgroundColor: selectedCrops.includes(c.id) ? '#4caf50' : '#fff',
                color: selectedCrops.includes(c.id) ? '#fff' : '#4caf50',
                transition: '0.2s'
              }}>
                <input type="checkbox" style={{display: 'none'}} checked={selectedCrops.includes(c.id)}
                  onChange={e => {
                    if (e.target.checked) setSelectedCrops([...selectedCrops, c.id]);
                    else setSelectedCrops(selectedCrops.filter(id => id !== c.id));
                  }}
                />
                {c.name}
              </label>
            ))}
            {crops.length === 0 && <span style={{color: '#f44336'}}>請先前往作物管理頁面新增作物</span>}
          </div>

          <p style={{fontSize: '0.9rem', color: '#666'}}>2. 作業內容：</p>
          <select style={styles.input} value={work.taskType} onChange={e => setWork({...work, taskType: e.target.value})}>
            {['施肥', '澆水', '噴藥', '整枝', '採收'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input style={styles.input} type="date" value={work.date} onChange={e => setWork({...work, date: e.target.value})} />
          <textarea style={{...styles.input, height: '80px'}} placeholder="備註事項..." value={work.note} onChange={e => setWork({...work, note: e.target.value})} />
          
          <button style={{...styles.button, backgroundColor: crops.length === 0 ? '#ccc' : '#4caf50'}} 
                  disabled={crops.length === 0} onClick={handleSave}>
            儲存紀錄
          </button>
        </div>
      </div>
    );
  };

  const HistoryPage = () => {
    const [filter, setFilter] = useState('');
    const filteredRecords = records.filter(r => r.cropName.includes(filter));

    return (
      <div>
        <div style={{marginBottom: '15px'}}>
          <input 
            style={styles.input} 
            placeholder="🔍 搜尋作物名稱..." 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
          />
        </div>
        {filteredRecords.length === 0 ? <p style={styles.emptyText}>無符合的紀錄。</p> : 
          filteredRecords.map(rec => (
            <div key={rec.id} style={styles.card}>
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <strong style={{color: '#2e7d32', fontSize: '1.1rem'}}>{rec.cropName}</strong>
                <span style={{color: '#888', fontSize: '0.85rem'}}>{rec.date}</span>
              </div>
              <div style={{marginTop: '10px'}}>
                <span style={{...styles.badge, backgroundColor: '#fff3e0', color: '#e65100'}}>{rec.taskType}</span>
                <p style={{margin: '10px 0 0 0', fontSize: '0.95rem', color: '#444'}}>{rec.note || '無備註'}</p>
              </div>
            </div>
          ))
        }
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {loading && <Loading />}
      
      <nav style={styles.nav}>
        <button style={styles.navButton(view === 'crops')} onClick={() => setView('crops')}>作物管理</button>
        <button style={styles.navButton(view === 'work')} onClick={() => setView('work')}>農事登記</button>
        <button style={styles.navButton(view === 'history')} onClick={() => setView('history')}>查詢紀錄</button>
      </nav>

      <main style={styles.content}>
        {view === 'crops' && <CropPage />}
        {view === 'work' && <WorkPage />}
        {view === 'history' && <HistoryPage />}
      </main>

      <footer style={{textAlign: 'center', padding: '20px', color: '#888', fontSize: '0.8rem'}}>
        Farm Record System © 2024
      </footer>
    </div>
  );
}