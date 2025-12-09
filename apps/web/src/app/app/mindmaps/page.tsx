'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { subjects as subjectsApi, Subject } from '@/lib/api';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  EmptyState,
} from '@/components/ui';
import {
  GitBranch,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  ChevronLeft,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  Type,
  Circle,
  BookOpen,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  NodeTypes,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface MindMap {
  id: string;
  name: string;
  description?: string;
  subjectId?: string;
  subjectName?: string;
  nodes: Node[];
  edges: Edge[];
  createdAt: string;
  updatedAt: string;
}

const NODE_COLORS = [
  { value: 'blue', label: 'Azul', bg: 'bg-blue-500', border: 'border-blue-600', text: 'text-white' },
  { value: 'emerald', label: 'Verde', bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-white' },
  { value: 'violet', label: 'Violeta', bg: 'bg-violet-500', border: 'border-violet-600', text: 'text-white' },
  { value: 'rose', label: 'Rosa', bg: 'bg-rose-500', border: 'border-rose-600', text: 'text-white' },
  { value: 'amber', label: 'Naranja', bg: 'bg-amber-500', border: 'border-amber-600', text: 'text-white' },
  { value: 'cyan', label: 'Cian', bg: 'bg-cyan-500', border: 'border-cyan-600', text: 'text-white' },
  { value: 'pink', label: 'Magenta', bg: 'bg-pink-500', border: 'border-pink-600', text: 'text-white' },
  { value: 'slate', label: 'Gris', bg: 'bg-slate-600', border: 'border-slate-700', text: 'text-white' },
];

function getColorClasses(color: string) {
  return NODE_COLORS.find(c => c.value === color) || NODE_COLORS[0];
}

// Custom Node Component
function MindMapNode({ data, selected }: { data: any; selected: boolean }) {
  const colorClasses = getColorClasses(data.color || 'blue');

  return (
    <div
      className={cn(
        'px-4 py-2 rounded-xl shadow-lg border-2 min-w-[120px] max-w-[200px] transition-all',
        colorClasses.bg,
        colorClasses.text,
        selected ? 'ring-4 ring-white/50 scale-105' : '',
        data.isRoot ? 'text-lg font-bold' : 'text-sm font-medium'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white/80 border-2 border-current"
      />
      <div className="text-center break-words">{data.label}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white/80 border-2 border-current"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="w-3 h-3 !bg-white/80 border-2 border-current"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-3 h-3 !bg-white/80 border-2 border-current"
      />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  mindmap: MindMapNode,
};

// Main Editor Component
function MindMapEditor({
  mindMap,
  onSave,
  onBack,
}: {
  mindMap: MindMap;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  onBack: () => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(mindMap.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(mindMap.edges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodeColor, setNodeColor] = useState('blue');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
    setNodeLabel(node.data.label);
    setNodeColor(node.data.color || 'blue');
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setIsEditingNode(false);
  }, []);

  const addNode = useCallback(() => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100
      },
      data: { label: 'Nueva idea', color: 'blue' },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [setNodes]);

  const addChildNode = useCallback(() => {
    if (!selectedNode) return;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'mindmap',
      position: {
        x: selectedNode.position.x + 50,
        y: selectedNode.position.y + 100,
      },
      data: { label: 'Subnodo', color: selectedNode.data.color || 'blue' },
    };

    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: selectedNode.id,
      target: newNode.id,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);
  }, [selectedNode, setNodes, setEdges]);

  const updateNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedNode.id
          ? { ...n, data: { ...n.data, label: nodeLabel, color: nodeColor } }
          : n
      )
    );
    setIsEditingNode(false);
  }, [selectedNode, nodeLabel, nodeColor, setNodes]);

  const deleteNode = useCallback(() => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);

  const handleSave = () => {
    onSave(nodes, edges);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <div className="w-px h-6 bg-secondary-200" />
          <h2 className="font-semibold text-secondary-900">{mindMap.name}</h2>
          {mindMap.subjectName && (
            <Badge variant="secondary">
              <BookOpen className="h-3 w-3 mr-1" />
              {mindMap.subjectName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addNode}>
            <Plus className="h-4 w-4 mr-1" />
            Nodo
          </Button>
          {selectedNode && (
            <>
              <Button variant="outline" size="sm" onClick={addChildNode}>
                <GitBranch className="h-4 w-4 mr-1" />
                Hijo
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditingNode(true)}>
                <Edit3 className="h-4 w-4 mr-1" />
                Editar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={deleteNode}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
          <div className="w-px h-6 bg-secondary-200" />
          <Button variant="gradient" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={reactFlowWrapper} className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <Panel position="bottom-right" className="flex gap-2">
            <button
              onClick={() => zoomIn()}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-secondary-50"
            >
              <ZoomIn className="h-4 w-4 text-secondary-600" />
            </button>
            <button
              onClick={() => zoomOut()}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-secondary-50"
            >
              <ZoomOut className="h-4 w-4 text-secondary-600" />
            </button>
            <button
              onClick={() => fitView()}
              className="p-2 bg-white rounded-lg shadow-md hover:bg-secondary-50"
            >
              <Maximize2 className="h-4 w-4 text-secondary-600" />
            </button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Edit Node Modal */}
      <Modal
        isOpen={isEditingNode}
        onClose={() => setIsEditingNode(false)}
        title="Editar nodo"
        variant="glass"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Texto
            </label>
            <Input
              value={nodeLabel}
              onChange={(e) => setNodeLabel(e.target.value)}
              placeholder="Escribe el texto del nodo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {NODE_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setNodeColor(color.value)}
                  className={cn(
                    'w-8 h-8 rounded-lg transition-all',
                    color.bg,
                    nodeColor === color.value
                      ? 'ring-2 ring-offset-2 ring-secondary-400 scale-110'
                      : 'hover:scale-105'
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsEditingNode(false)}>
              Cancelar
            </Button>
            <Button variant="gradient" onClick={updateNode}>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Wrapped Editor with Provider
function MindMapEditorWrapper(props: {
  mindMap: MindMap;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  onBack: () => void;
}) {
  return (
    <ReactFlowProvider>
      <MindMapEditor {...props} />
    </ReactFlowProvider>
  );
}

// Main Page Component
export default function MindMapsPage() {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [selectedMap, setSelectedMap] = useState<MindMap | null>(null);

  // Modal states
  const [isNewMapModalOpen, setIsNewMapModalOpen] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapDescription, setNewMapDescription] = useState('');
  const [newMapSubjectId, setNewMapSubjectId] = useState('');

  // Load subjects
  useEffect(() => {
    if (token) {
      subjectsApi.list(token).then(data => setSubjects(Array.isArray(data) ? data : [])).catch(console.error);
    }
  }, [token]);

  // Load mind maps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mind-maps');
    if (saved) {
      setMindMaps(JSON.parse(saved));
    }
  }, []);

  const saveMindMaps = (maps: MindMap[]) => {
    setMindMaps(maps);
    localStorage.setItem('mind-maps', JSON.stringify(maps));
  };

  const createMindMap = () => {
    if (!newMapName.trim()) return;

    const initialNodes: Node[] = [
      {
        id: 'root',
        type: 'mindmap',
        position: { x: 250, y: 50 },
        data: { label: newMapName, color: 'blue', isRoot: true },
      },
    ];

    const newMap: MindMap = {
      id: Date.now().toString(),
      name: newMapName,
      description: newMapDescription,
      subjectId: newMapSubjectId || undefined,
      subjectName: subjects.find((s) => s.id === newMapSubjectId)?.name,
      nodes: initialNodes,
      edges: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveMindMaps([...mindMaps, newMap]);
    setIsNewMapModalOpen(false);
    setNewMapName('');
    setNewMapDescription('');
    setNewMapSubjectId('');
    setSelectedMap(newMap);
  };

  const saveMindMapContent = (nodes: Node[], edges: Edge[]) => {
    if (!selectedMap) return;

    const updatedMaps = mindMaps.map((m) =>
      m.id === selectedMap.id
        ? { ...m, nodes, edges, updatedAt: new Date().toISOString() }
        : m
    );
    saveMindMaps(updatedMaps);

    // Update selected map with new data
    setSelectedMap({ ...selectedMap, nodes, edges, updatedAt: new Date().toISOString() });
  };

  const deleteMindMap = (id: string) => {
    saveMindMaps(mindMaps.filter((m) => m.id !== id));
  };

  const subjectOptions = [
    { value: '', label: 'Sin materia' },
    ...subjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  // If editing a map, show the editor
  if (selectedMap) {
    return (
      <MindMapEditorWrapper
        mindMap={selectedMap}
        onSave={saveMindMapContent}
        onBack={() => setSelectedMap(null)}
      />
    );
  }

  // Main view - list of mind maps
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-secondary-200/50 bg-gradient-to-r from-cyan-50/80 via-white to-blue-50/80">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                <GitBranch className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-secondary-900 tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 to-blue-500">
                    Mapas
                  </span> Mentales
                </h1>
                <p className="text-secondary-500 mt-0.5">
                  Organiza tus ideas de forma visual
                </p>
              </div>
            </div>

            <Button variant="gradient" onClick={() => setIsNewMapModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo mapa
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {mindMaps.length === 0 ? (
            <EmptyState
              icon={<GitBranch className="h-8 w-8" />}
              title="Sin mapas mentales"
              description="Crea tu primer mapa mental para organizar tus ideas visualmente"
              action={
                <Button variant="gradient" onClick={() => setIsNewMapModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear mapa mental
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mindMaps.map((map) => (
                <Card
                  key={map.id}
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedMap(map)}
                >
                  <div className="h-2 bg-gradient-to-r from-cyan-500 to-blue-500" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                        <GitBranch className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMindMap(map.id);
                          }}
                          className="p-2 text-secondary-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-semibold text-secondary-900 mb-1">{map.name}</h3>
                    {map.description && (
                      <p className="text-sm text-secondary-500 mb-3 line-clamp-2">
                        {map.description}
                      </p>
                    )}
                    {map.subjectName && (
                      <Badge variant="secondary" className="mb-3">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {map.subjectName}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-secondary-100">
                      <span className="text-sm text-secondary-500">
                        {map.nodes.length} nodos
                      </span>
                      <span className="text-xs text-secondary-400">
                        {new Date(map.updatedAt).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Map Modal */}
      <Modal
        isOpen={isNewMapModalOpen}
        onClose={() => setIsNewMapModalOpen(false)}
        title="Nuevo mapa mental"
        description="Crea un mapa mental para organizar tus ideas"
        variant="glass"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Nombre *
            </label>
            <Input
              placeholder="Ej: Resumen Capítulo 5"
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full px-3 py-2 border border-secondary-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={2}
              placeholder="¿De qué trata este mapa?"
              value={newMapDescription}
              onChange={(e) => setNewMapDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Materia
            </label>
            <Select
              options={subjectOptions}
              value={newMapSubjectId}
              onChange={(e) => setNewMapSubjectId(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-secondary-100">
            <Button variant="outline" onClick={() => setIsNewMapModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={createMindMap}
              disabled={!newMapName.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
