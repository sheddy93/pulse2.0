import React, { useState } from "react";
import { Draggable, Droppable, DragDropContext } from "@hello-pangea/dnd";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";

const DEFAULT_GRID_COLS = 12;

export default function DashboardGrid({
  widgets = [],
  onLayoutChange,
  isEditing = false,
  onToggleEdit
}) {
  const [sizes, setSizes] = useState(
    widgets.reduce((acc, w) => {
      acc[w.id] = { cols: w.cols || 4, rows: w.rows || 2 };
      return acc;
    }, {})
  );

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newOrder = Array.from(widgets);
    const [movedWidget] = newOrder.splice(source.index, 1);
    newOrder.splice(destination.index, 0, movedWidget);

    onLayoutChange(newOrder);
  };

  const toggleSize = (widgetId) => {
    setSizes(prev => {
      const current = prev[widgetId] || { cols: 4, rows: 2 };
      const isExpanded = current.cols === DEFAULT_GRID_COLS;
      const newSize = isExpanded
        ? { cols: 4, rows: 2 }
        : { cols: DEFAULT_GRID_COLS, rows: 3 };

      const updated = { ...prev, [widgetId]: newSize };
      
      // Save expanded state
      const updatedWidgets = widgets.map(w =>
        w.id === widgetId ? { ...w, cols: newSize.cols, rows: newSize.rows } : w
      );
      onLayoutChange(updatedWidgets);

      return updated;
    });
  };

  return (
    <div className="space-y-4">
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between">
          <p className="text-sm font-medium text-blue-800">
            🎨 Modalità personalizzazione attiva - Trascina i widget per riordinarli
          </p>
          <button
            onClick={onToggleEdit}
            className="px-3 py-1 text-sm font-semibold bg-white border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Fine personalizzazione
          </button>
        </div>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-grid" type="WIDGET">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`grid grid-cols-12 gap-4 ${
                snapshot.isDraggingOver ? "bg-slate-50 rounded-lg p-4" : ""
              }`}
            >
              {widgets.map((widget, idx) => {
                const size = sizes[widget.id] || { cols: 4, rows: 2 };
                const isExpanded = size.cols === DEFAULT_GRID_COLS;

                return (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={idx}
                    isDragDisabled={!isEditing}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`col-span-${size.cols} row-span-${size.rows} min-h-${size.rows === 3 ? "96" : "64"} transition-all ${
                          snapshot.isDragging ? "opacity-50" : ""
                        }`}
                        style={{
                          gridColumn: `span ${Math.min(size.cols, DEFAULT_GRID_COLS)}`,
                          minHeight: `${size.rows * 20}rem`
                        }}
                      >
                        <div
                          className={`h-full bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col transition-all ${
                            snapshot.isDragging ? "shadow-lg" : "shadow-sm"
                          } ${isEditing ? "ring-2 ring-blue-300" : ""}`}
                        >
                          {/* Widget Header */}
                          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50">
                            {isEditing && (
                              <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                <GripVertical className="w-4 h-4 text-slate-400" />
                              </div>
                            )}
                            <h3 className="flex-1 font-semibold text-slate-800 text-sm">{widget.title}</h3>
                            {isEditing && (
                              <button
                                onClick={() => toggleSize(widget.id)}
                                className="p-1.5 hover:bg-white rounded-lg transition-colors"
                                title={isExpanded ? "Riduci" : "Espandi"}
                              >
                                {isExpanded ? (
                                  <Minimize2 className="w-4 h-4 text-slate-600" />
                                ) : (
                                  <Maximize2 className="w-4 h-4 text-slate-600" />
                                )}
                              </button>
                            )}
                          </div>

                          {/* Widget Content */}
                          <div className="flex-1 overflow-auto p-5">
                            {widget.component}
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}