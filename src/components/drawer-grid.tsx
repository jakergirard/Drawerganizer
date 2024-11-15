'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronDown, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { debounce } from 'lodash';
import { toast } from 'sonner';

const ROW_LABELS = Array.from({ length: 12 }, (_, i) => 
  String.fromCharCode(65 + i)
);

const COL_LABELS = Array.from({ length: 15 }, (_, i) => 
  (i + 1).toString().padStart(2, '0')
);

const DRAWER_GAP = 4;

// Add type safety for drawer sizes
type DrawerSize = 'SMALL' | 'MEDIUM' | 'LARGE';

// Update the Drawer interface
interface Drawer {
  id: string;
  size: DrawerSize;
  title: string;
  name?: string;
  positions: number[];
  isRightSection: boolean;
  keywords: string[];
  spacing: number;
}

interface BaseSize {
  width: number;
  height: number;
  mediumBaseWidth: number;
}

interface SizeConfig {
  width: number;
  height: number;
  label: string;
  span: number;
  spacing: number;
}

interface Sizes {
  LEFT: {
    SMALL: SizeConfig;
    MEDIUM: SizeConfig;
    LARGE: SizeConfig;
  };
  RIGHT: {
    SMALL: SizeConfig;
    MEDIUM: SizeConfig;
    LARGE: SizeConfig;
  };
}

// Add error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}

const AutoResizingText = ({ text, width, height }: { text: string, width: number, height: number }) => {
  const [fontSize, setFontSize] = useState(12);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeText = () => {
      const element = textRef.current;
      if (!element) return;

      let size = 12;
      element.style.fontSize = `${size}px`;
      
      while (
        (element.scrollHeight <= height && element.scrollWidth <= width) && 
        size < 14
      ) {
        size++;
        element.style.fontSize = `${size}px`;
      }

      while (
        (element.scrollHeight > height || element.scrollWidth > width) && 
        size > 6
      ) {
        size--;
        element.style.fontSize = `${size}px`;
      }

      setFontSize(size);
    };

    resizeText();
    window.addEventListener('resize', resizeText);
    return () => window.removeEventListener('resize', resizeText);
  }, [text, width, height]);

  return (
    <div
      ref={textRef}
      style={{
        fontSize: `${fontSize}px`,
        width: `${width}px`,
        height: `${height}px`,
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      className="text-foreground font-medium"
    >
      {text}
    </div>
  );
};

export const DrawerGrid = () => {
    const [baseSize, setBaseSize] = useState<BaseSize>({ width: 0, height: 0, mediumBaseWidth: 0 });
    
    const calculateBaseSize = useCallback(() => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 48;
      const topSpace = 80;
      const rowLabelWidth = 24; // width of the row label container
      
      const totalWidth = Math.max(0, viewportWidth - padding);
      const sectionWidth = Math.max(0, (totalWidth - (rowLabelWidth * 3)) / 2); // account for both row label columns
      
      const smallDrawerWidth = Math.max(0, (sectionWidth - (8 * DRAWER_GAP)) / 9);
      const mediumDrawerWidth = Math.max(0, (sectionWidth - (5 * DRAWER_GAP)) / 6);
      
      const availableHeight = Math.max(0, viewportHeight - padding - topSpace);
      const drawerHeight = Math.max(0, (availableHeight - (11 * DRAWER_GAP)) / 12);
      
      setBaseSize({
        width: smallDrawerWidth,
        mediumBaseWidth: mediumDrawerWidth,
        height: drawerHeight
      });
    }, []);
  
    useEffect(() => {
      calculateBaseSize();
      window.addEventListener('resize', calculateBaseSize);
      return () => {
        window.removeEventListener('resize', calculateBaseSize);
      };
    }, [calculateBaseSize]);
  
    const SIZES: Sizes = {
      LEFT: {
        SMALL: {
          width: baseSize.width,
          height: baseSize.height,
          label: 'Small',
          span: 1,
          spacing: 0
        },
        MEDIUM: {
          width: (baseSize.width * 1.5),
          height: baseSize.height,
          label: 'Medium',
          span: 1.5,
          spacing: baseSize.width * 0.5
        },
        LARGE: {
          width: (baseSize.width * 3),  // Removed DRAWER_GAP
          height: baseSize.height,
          label: 'Large',
          span: 3,
          spacing: 0
        }
      },
      RIGHT: {
        SMALL: {
          width: baseSize.mediumBaseWidth * 0.75,
          height: baseSize.height,
          label: 'Small',
          span: 1,
          spacing: baseSize.mediumBaseWidth * 0.25  // This will now update dynamically with window resizing
        },
        MEDIUM: {
          width: baseSize.mediumBaseWidth,
          height: baseSize.height,
          label: 'Medium',
          span: 1,
          spacing: 0
        },
        LARGE: {
          width: baseSize.mediumBaseWidth * 2,  // Removed DRAWER_GAP
          height: baseSize.height,
          label: 'Large',
          span: 2,
          spacing: 0
        }
      }
    };
  
    const [drawers, setDrawers] = useState<Record<string, Drawer>>(() => {
      const initial: Record<string, Drawer> = {};
      ROW_LABELS.forEach(row => {
        for (let col = 1; col <= 9; col++) {
          initial[`${row}${col}`] = {
            id: `${row}${col}`,
            size: 'SMALL',
            title: `${row}${col.toString().padStart(2, '0')}`,
            positions: [col],
            isRightSection: false,
            keywords: [],
            spacing: 0
          };
        }
        for (let col = 10; col <= 15; col++) {
          initial[`${row}${col}`] = {
            id: `${row}${col}`,
            size: 'MEDIUM',
            title: `${row}${col.toString().padStart(2, '0')}`,
            positions: [col],
            isRightSection: true,
            keywords: [],
            spacing: 0
          };
        }
      });
      return initial;
    });

    useEffect(() => {
      fetch('/api/drawers')
        .then(res => res.json())
        .then(data => {
          if (data && data.length > 0) {
            const drawersMap = data.reduce((acc: Record<string, Drawer>, drawer: any) => {
              acc[drawer.id] = {
                ...drawer,
                positions: JSON.parse(drawer.positions),
                keywords: JSON.parse(drawer.keywords)
              };
              return acc;
            }, {});
            setDrawers(drawersMap);
          }
        });
    }, []);

    // Add debounced save function
    const debouncedSave = useCallback(
      debounce((drawersData: Record<string, Drawer>) => {
        const serializedDrawers = Object.values(drawersData).map(drawer => ({
          ...drawer,
          positions: JSON.stringify(drawer.positions),
          keywords: JSON.stringify(drawer.keywords)
        }));
        
        fetch('/api/drawers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serializedDrawers),
        });
      }, 1000),
      []
    );

    // Update existing setDrawers calls
    useEffect(() => {
      debouncedSave(drawers);
    }, [drawers, debouncedSave]);

    const [searchTerm, setSearchTerm] = useState('');

    const handleSizeChange = (drawerId: string, newSize: DrawerSize) => {
      const drawer = drawers[drawerId];
      const [row, startCol] = [drawerId[0], parseInt(drawerId.slice(1))];
      const isRightSection = startCol >= 10;
      const sizeConfig = isRightSection ? SIZES.RIGHT : SIZES.LEFT;
      
      setDrawers(prev => {
        const newDrawers = { ...prev };
        if (isRightSection) {
          if (drawer.size === 'MEDIUM') {
            if (newSize === 'LARGE' && startCol < 15) {
              const absorbedId = `${row}${startCol + 1}`;
              delete newDrawers[absorbedId];
              newDrawers[drawerId] = {
                ...drawer,
                size: 'LARGE',
                positions: [startCol, startCol + 1],
                title: `${row}${startCol.toString().padStart(2, '0')},${(startCol + 1).toString().padStart(2, '0')}`,
                spacing: 0
              };
            } else if (newSize === 'SMALL') {
              newDrawers[drawerId] = {
                ...drawer,
                size: 'SMALL',
                positions: [startCol],
                title: `${row}${startCol.toString().padStart(2, '0')}`,
                spacing: sizeConfig.SMALL.spacing
              };
            }
          } else if (drawer.size === 'LARGE') {
            if (newSize === 'MEDIUM') {
              // Convert LARGE drawer back to two MEDIUM drawers
              newDrawers[drawerId] = {
                ...drawer,
                size: 'MEDIUM',
                positions: [startCol],
                title: `${row}${startCol.toString().padStart(2, '0')}`,
                spacing: 0
              };
              
              const nextPos = startCol + 1;
              newDrawers[`${row}${nextPos}`] = {
                id: `${row}${nextPos}`,
                size: 'MEDIUM',
                title: `${row}${nextPos.toString().padStart(2, '0')}`,
                positions: [nextPos],
                isRightSection: true,
                keywords: [],
                spacing: 0
              };
            } else if (newSize === 'SMALL') {
              // Convert LARGE back to one SMALL and one MEDIUM drawer
              newDrawers[drawerId] = {
                ...drawer,
                size: 'SMALL',
                positions: [startCol],
                title: `${row}${startCol.toString().padStart(2, '0')}`,
                spacing: sizeConfig.SMALL.spacing
              };
              
              const nextPos = startCol + 1;
              newDrawers[`${row}${nextPos}`] = {
                id: `${row}${nextPos}`,
                size: 'MEDIUM',
                title: `${row}${nextPos.toString().padStart(2, '0')}`,
                positions: [nextPos],
                isRightSection: true,
                keywords: [],
                spacing: 0
              };
            }
          } else if (drawer.size === 'SMALL') {
            if (newSize === 'MEDIUM') {
              newDrawers[drawerId] = {
                ...drawer,
                size: 'MEDIUM',
                positions: [startCol],
                title: `${row}${startCol.toString().padStart(2, '0')}`,
                spacing: 0
              };
            } else if (newSize === 'LARGE' && startCol < 15) {
              const nextDrawerId = `${row}${startCol + 1}`;
              delete newDrawers[nextDrawerId];
              newDrawers[drawerId] = {
                ...drawer,
                size: 'LARGE',
                positions: [startCol, startCol + 1],
                title: `${row}${startCol.toString().padStart(2, '0')},${(startCol + 1).toString().padStart(2, '0')}`,
                spacing: 0
              };
            }
          }
        } else {
          if (drawer.size === 'SMALL' && newSize === 'MEDIUM') {
            const nextDrawerId = `${row}${startCol + 1}`;
            const nextDrawer = newDrawers[nextDrawerId];
            delete newDrawers[nextDrawerId];
            
            newDrawers[drawerId] = {
              ...drawer,
              size: 'MEDIUM',
              positions: [startCol, startCol + 1],
              title: `${row}${startCol.toString().padStart(2, '0')},${(startCol + 1).toString().padStart(2, '0')}`,
              spacing: sizeConfig.MEDIUM.spacing
            };
          } else if (drawer.size === 'MEDIUM' && newSize === 'SMALL') {
            const nextCol = startCol + 1;
            newDrawers[drawerId] = {
              ...drawer,
              size: 'SMALL',
              positions: [startCol],
              title: `${row}${startCol.toString().padStart(2, '0')}`,
              spacing: 0
            };
            
            newDrawers[`${row}${nextCol}`] = {
              id: `${row}${nextCol}`,
              size: 'SMALL',
              title: `${row}${nextCol.toString().padStart(2, '0')}`,
              positions: [nextCol],
              isRightSection: false,
              keywords: [],
              spacing: 0
            };
          } else if (newSize === 'LARGE') {
            if (startCol + 2 <= 9) {
              const newPositions = [startCol, startCol + 1, startCol + 2];
              newPositions.slice(1).forEach(pos => {
                delete newDrawers[`${row}${pos}`];
              });
              
              newDrawers[drawerId] = {
                ...drawer,
                size: 'LARGE',
                positions: newPositions,
                title: `${row}${newPositions.map(p => p.toString().padStart(2, '0')).join(',')}`,
                spacing: 0
              };
            }
          } else if (drawer.size === 'LARGE') {
            newDrawers[drawerId] = {
              ...drawer,
              size: newSize,
              positions: [startCol],
              title: `${row}${startCol.toString().padStart(2, '0')}`,
              spacing: sizeConfig[newSize].spacing
            };
            
            if (newSize === 'MEDIUM') {
              // Create one small drawer for the remaining space
              [1, 2].forEach((offset) => {
                const pos = startCol + offset;
                if (offset === 1) {
                  // First position becomes part of the MEDIUM drawer
                  newDrawers[drawerId].positions.push(pos);
                  newDrawers[drawerId].title = `${row}${startCol.toString().padStart(2, '0')},${pos.toString().padStart(2, '0')}`;
                } else {
                  // Second position becomes a new SMALL drawer
                  newDrawers[`${row}${pos}`] = {
                    id: `${row}${pos}`,
                    size: 'SMALL',
                    title: `${row}${pos.toString().padStart(2, '0')}`,
                    positions: [pos],
                    isRightSection: false,
                    keywords: [],
                    spacing: 0
                  };
                }
              });
            } else if (newSize === 'SMALL') {
              // Create two small drawers for the remaining space
              [1, 2].forEach((offset) => {
                const pos = startCol + offset;
                newDrawers[`${row}${pos}`] = {
                  id: `${row}${pos}`,
                  size: 'SMALL',
                  title: `${row}${pos.toString().padStart(2, '0')}`,
                  positions: [pos],
                  isRightSection: false,
                  keywords: [],
                  spacing: 0
                };
              });
            }
          } else if (drawer.size === 'SMALL' && newSize === ('LARGE' as DrawerSize) && startCol < 15) {
            const nextDrawerId = `${row}${startCol + 1}`;
            delete newDrawers[nextDrawerId];
            newDrawers[drawerId] = {
              ...drawer,
              size: newSize,
              positions: [startCol, startCol + 1],
              title: `${row}${startCol.toString().padStart(2, '0')},${(startCol + 1).toString().padStart(2, '0')}`,
              spacing: 0,
              isRightSection: true
            };
          }
        }
        
        return newDrawers;
      });
    };
  
    const isDrawerVisible = (drawer: Drawer) => {
      if (!drawer || !searchTerm) return true;
      const searchLower = searchTerm.toLowerCase().trim();
      return (drawer.name?.toLowerCase().includes(searchLower) ||
              drawer.title.toLowerCase().includes(searchLower) ||
              drawer.keywords.some(keyword => 
                keyword.toLowerCase().includes(searchLower)
              ));
    };

    const handleDrawerUpdate = (drawerId: string, updatedDrawer: Drawer) => {
      setDrawers(prev => ({
        ...prev,
        [drawerId]: updatedDrawer
      }));
    };

    const DrawerModal = ({ 
      drawer, 
      onDrawerUpdate 
    }: { 
      drawer: Drawer;
      onDrawerUpdate: (drawerId: string, updatedDrawer: Drawer) => void;
    }) => {
      const [showAdvanced, setShowAdvanced] = useState(false);
      const [name, setName] = useState(drawer.name || '');
      const [keywords, setKeywords] = useState(drawer.keywords.join(', '));
      const [localSize, setLocalSize] = useState<DrawerSize>(drawer.size);
      const sizeConfig = drawer.isRightSection ? SIZES.RIGHT : SIZES.LEFT;
      const drawerSize = sizeConfig[drawer.size];
      const currentSpacing = (drawer.isRightSection && drawer.size === 'SMALL') || 
                            (!drawer.isRightSection && drawer.size === 'MEDIUM') 
                            ? sizeConfig[drawer.size].spacing 
                            : drawer.spacing;

      const handleSave = () => {
        const updatedDrawer = {
          ...drawer,
          name,
          keywords: keywords.split(',').map(k => k.trim()).filter(k => k !== '')
        };
        if (localSize !== drawer.size) {
          handleSizeChange(drawer.id, localSize);
        } else {
          onDrawerUpdate(drawer.id, updatedDrawer);
        }
      };
      
      return (
        <div style={{ 
          display: 'flex', 
          width: `${drawerSize.width + currentSpacing}px`,
          position: 'relative'
        }}>
          <Card 
            style={{
              width: `${drawerSize.width}px`,
              height: `${drawerSize.height}px`,
              marginRight: `${DRAWER_GAP}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}
            className={`
              cursor-pointer 
              hover:bg-gray-700 
              transition-colors 
              duration-200
              ${isDrawerVisible(drawer) ? 'opacity-100' : 'opacity-30'}
            `}
          >
            <div className="absolute inset-0">
              {drawer.name ? (
                <div className="w-full h-full flex items-center justify-center p-2">
                  <AutoResizingText 
                    text={drawer.name} 
                    width={drawerSize.width - 16} 
                    height={drawerSize.height - 16}
                  />
                </div>
              ) : (
                <div className="absolute top-1 left-2 text-xs text-muted-foreground opacity-50">
                  {drawer.title}
                </div>
              )}
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <div className="absolute inset-0" />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Drawer {drawer.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <textarea
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter drawer name"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Keywords</label>
                    <textarea
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="Enter comma-separated keywords"
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-muted-foreground mb-6">Separate keywords with commas (e.g. key1, key2, key3)</p>
                  </div>

                  <div className={`border rounded-lg transition-all duration-200 ${
                    showAdvanced ? '' : 'border'
                  }`}>
                    <Button
                      variant={showAdvanced ? "ghost" : "outline"}
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className={`w-full justify-between ${
                        showAdvanced ? 'rounded-t-lg border-b' : 'rounded-lg'
                      }`}
                    >
                      <span>Advanced Settings</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </Button>
                    
                    <div className={`space-y-4 px-4 transition-all duration-200 ${
                      showAdvanced ? 'py-4 h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'
                    }`}>
                      <label className="text-sm font-medium">Size</label>
                      <div className="flex gap-2">
                        {Object.keys(sizeConfig).map((size) => (
                          <Button
                            key={size}
                            variant={localSize === size ? "default" : "outline"}
                            onClick={() => setLocalSize(size as DrawerSize)}
                            disabled={
                              drawer.isRightSection ?
                                (size === 'LARGE' && drawer.positions[0] >= 15) :
                                (size !== 'SMALL' && 
                                 drawer.positions[0] + SIZES.LEFT[size as keyof typeof SIZES.LEFT].span - 1 > 9)
                            }
                          >
                            {sizeConfig[size as keyof typeof sizeConfig].label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 w-full">
                    <Button onClick={handleSave} className="flex-1">
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      disabled={!name}
                      onClick={async () => {
                        const cupsServer = localStorage.getItem("cupsServer")
                        const queueName = localStorage.getItem("queueName")
                        
                        if (!cupsServer || !queueName) {
                          toast.error("Please configure CUPS server and queue name in settings");
                          return;
                        }

                        try {
                          const printResponse = await fetch('/api/print', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                              text: name || drawer.title,
                              server: cupsServer,
                              queue: queueName
                            }),
                          });

                          const result = await printResponse.json();

                          if (!printResponse.ok) {
                            throw new Error(result.error || 'Print failed');
                          }
                          
                          toast.success('Label printed successfully');
                        } catch (error) {
                          toast.error('Print failed. Please check your CUPS configuration.');
                        }
                      }}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
          {drawer.spacing > 0 && (
            <div style={{ 
              width: `${drawer.spacing}px`,
              height: `${drawerSize.height}px`,
              backgroundColor: 'transparent'
            }} />
          )}
        </div>
      );
    };
    
      const renderDrawerSection = (startCol: number, endCol: number) => {
        const colWidth = startCol >= 10 ? baseSize.mediumBaseWidth : baseSize.width;
        return (
          <div>
            <div className="flex mb-2">
              <div className="w-6 mr-1" />  {/* Reduced from mr-2 to mr-1 */}
              <div className="flex">
                {COL_LABELS.slice(startCol - 1, endCol).map((col, index) => {
                  const colNumber = parseInt(col);
                  const cumulativeSpacing = startCol >= 10 
                    ? index * DRAWER_GAP 
                    : index * DRAWER_GAP;
                  
                  return (
                    <div 
                      key={col} 
                      className="flex items-center justify-center text-gray-400"
                      style={{ 
                        width: `${colWidth}px`, 
                        marginRight: `${DRAWER_GAP}px`,
                        position: 'relative',
                        left: `-${cumulativeSpacing}px`
                      }}
                    >
                      {col}
                    </div>
                  );
                })}
              </div>
            </div>
            {ROW_LABELS.map(row => {
              const rowDrawers = Object.values(drawers)
                .filter(d => d.id[0] === row && 
                            d.positions[0] >= startCol && 
                            d.positions[0] <= endCol)
                .sort((a, b) => a.positions[0] - b.positions[0]);
    
              return (
                <div 
                  key={row} 
                  className="flex" 
                  style={{ marginBottom: `${DRAWER_GAP}px` }}
                >
                  <div className="w-6 flex items-center justify-center text-gray-400 mr-1">  {/* Reduced from mr-2 to mr-1 */}
                    {row}
                  </div>
                  <div className="flex">
                    {rowDrawers.map(drawer => (
                      <DrawerModal
                        key={drawer.id}
                        drawer={drawer}
                        onDrawerUpdate={handleDrawerUpdate}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      };
    
      if (!baseSize.width || !baseSize.mediumBaseWidth) return null;
    
      return (
        <div className="h-screen p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-5 h-5 text-muted-foreground" />
            <div className="w-[600px]">
              <Input
                type="text"
                placeholder="Search drawers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">  {/* Changed from gap-6 */}
            <div className="flex flex-col">
              {renderDrawerSection(1, 9)}
            </div>
            <div className="flex flex-col">
              {renderDrawerSection(10, 15)}
            </div>
          </div>
        </div>
      );
    };

// Wrap the export with ErrorBoundary
export default function DrawerGridWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <DrawerGrid />
    </ErrorBoundary>
  );
}
