// src/components/Visualizer/HeapGraph.jsx
import './Visualizer.css'

export default function HeapGraph({ heap }) {
  return (
    <div className="heap-section">
      <h3 className="section-title">Heap Objects</h3>
      <div className="heap-objects">
        {heap.map((obj) => (
          <div key={obj.id} className="heap-object">
            <div className="heap-header">
              <span className="heap-id">id: {obj.id}</span>
              <span className="heap-type">{obj.type}</span>
            </div>
            <div className="heap-value">{obj.repr}</div>
            {obj.size && <span className="heap-size">{obj.size} bytes</span>}
          </div>
        ))}
        {heap.length === 0 && (
          <span className="no-heap">No heap objects</span>
        )}
      </div>
    </div>
  )
}
