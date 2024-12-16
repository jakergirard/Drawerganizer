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
import { LabelPreviewModal } from './label-preview-modal';
import { logger } from '@/lib/logger';

/* eslint-disable react-hooks/exhaustive-deps */

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
interface DrawerData {
  id: string;
  size: DrawerSize;
  title: string;
  name: string | null;
  positions: string;
  is_right_section: boolean;
  keywords: string;
  spacing: number;
  created_at: Date;
  updated_at: Date;
}

interface BaseSize {
  width: number;
  height: number;
  medium_base_width: number;
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
  const [font_size, set_font_size] = useState(12);
  const text_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resize_text = () => {
      const element = text_ref.current;
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

      set_font_size(size);
    };

    resize_text();
    window.addEventListener('resize', resize_text);
    return () => window.removeEventListener('resize', resize_text);
  }, [text, width, height]);

  return (
    <div
      ref={text_ref}
      style={{
        fontSize: `${font_size}px`,
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
    const [base_size, set_base_size] = useState<BaseSize>({ 
      width: 0, 
      height: 0, 
      medium_base_width: 0 
    });
    
    const calculate_base_size = useCallback(() => {
      const viewport_width = window.innerWidth;
      const viewport_height = window.innerHeight;
      const padding = 48;
      const top_space = 80;
      const row_label_width = 24;
      
      const total_width = Math.max(0, viewport_width - padding);
      const section_width = Math.max(0, (total_width - (row_label_width * 3)) / 2);
      
      const small_drawer_width = Math.max(0, (section_width - (8 * DRAWER_GAP)) / 9);
      const medium_drawer_width = Math.max(0, (section_width - (5 * DRAWER_GAP)) / 6);
      
      const available_height = Math.max(0, viewport_height - padding - top_space);
      const drawer_height = Math.max(0, (available_height - (11 * DRAWER_GAP)) / 12);
      
      set_base_size({
        width: small_drawer_width,
        medium_base_width: medium_drawer_width,
        height: drawer_height
      });
    }, []);
  
    useEffect(() => {
      calculate_base_size();
      window.addEventListener('resize', calculate_base_size);
      return () => {
        window.removeEventListener('resize', calculate_base_size);
      };
    }, [calculate_base_size]);
  
    const SIZES: Sizes = {
      LEFT: {
        SMALL: {
          width: base_size.width,
          height: base_size.height,
          label: 'Small',
          span: 1,
          spacing: 0
        },
        MEDIUM: {
          width: (base_size.width * 1.5),
          height: base_size.height,
          label: 'Medium',
          span: 1.5,
          spacing: base_size.width * 0.5
        },
        LARGE: {
          width: (base_size.width * 3),  // Removed DRAWER_GAP
          height: base_size.height,
          label: 'Large',
          span: 3,
          spacing: 0
        }
      },
      RIGHT: {
        SMALL: {
          width: base_size.medium_base_width * 0.75,
          height: base_size.height,
          label: 'Small',
          span: 1,
          spacing: base_size.medium_base_width * 0.25  // This will now update dynamically with window resizing
        },
        MEDIUM: {
          width: base_size.medium_base_width,
          height: base_size.height,
          label: 'Medium',
          span: 1,
          spacing: 0
        },
        LARGE: {
          width: base_size.medium_base_width * 2,  // Removed DRAWER_GAP
          height: base_size.height,
          label: 'Large',
          span: 2,
          spacing: 0
        }
      }
    };
  
    const [drawers, set_drawers] = useState<Record<string, DrawerData>>({});

    // Add debounced save function
    const debounced_save = useCallback(
      debounce((drawers_data: Record<string, DrawerData>) => {
        const serializedDrawers = Object.values(drawers_data).map(drawer => ({
          ...drawer,
          positions: Array.isArray(drawer.positions) ? 
            JSON.stringify(drawer.positions) : drawer.positions,
          keywords: Array.isArray(drawer.keywords) ? 
            JSON.stringify(drawer.keywords) : drawer.keywords,
          is_right_section: Boolean(drawer.is_right_section)  // Send as boolean
        }));
        
        console.log('Saving drawers:', { count: serializedDrawers.length });
        fetch('/api/drawers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serializedDrawers),
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to save drawers');
          }
          console.log('Drawers saved successfully');
        })
        .catch(error => {
          console.error('Failed to save drawers:', error);
        });
      }, 1000),
      []
    );

    useEffect(() => {
      console.log('Fetching drawers from API');
      fetch('/api/drawers')
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch drawers');
          }
          return res.json();
        })
        .then(data => {
          console.log('Received drawers from API:', { count: data?.length || 0 });
          if (data && data.length > 0) {
            const drawersMap = data.reduce((acc: Record<string, DrawerData>, drawer: any) => {
              try {
                const positions = typeof drawer.positions === 'string' ? 
                  JSON.parse(drawer.positions) : drawer.positions;
                const keywords = typeof drawer.keywords === 'string' ? 
                  JSON.parse(drawer.keywords) : drawer.keywords;
                
                acc[drawer.id] = {
                  ...drawer,
                  positions,
                  keywords,
                  is_right_section: Boolean(drawer.is_right_section)
                };
              } catch (error) {
                console.error(`Failed to parse drawer data for ${drawer.id}:`, error);
              }
              return acc;
            }, {});
            console.log('Processed drawers:', { count: Object.keys(drawersMap).length });
            set_drawers(drawersMap);
          } else {
            // Initialize with default drawers if none exist
            const initial: Record<string, DrawerData> = {};
            ROW_LABELS.forEach(row => {
              for (let col = 1; col <= 9; col++) {
                const positions = [col];
                initial[`${row}${col}`] = {
                  id: `${row}${col}`,
                  size: 'SMALL',
                  title: `${row}${col.toString().padStart(2, '0')}`,
                  name: null,
                  positions: JSON.stringify(positions),
                  is_right_section: false,
                  keywords: JSON.stringify([]),
                  spacing: 0,
                  created_at: new Date(),
                  updated_at: new Date()
                };
              }
              for (let col = 10; col <= 15; col++) {
                const positions = [col];
                initial[`${row}${col}`] = {
                  id: `${row}${col}`,
                  size: 'MEDIUM',
                  title: `${row}${col.toString().padStart(2, '0')}`,
                  name: null,
                  positions: JSON.stringify(positions),
                  is_right_section: true,
                  keywords: JSON.stringify([]),
                  spacing: 0,
                  created_at: new Date(),
                  updated_at: new Date()
                };
              }
            });
            console.log('Initializing with default drawers');
            set_drawers(initial);
            // Save initial drawers to database
            debounced_save(initial);
          }
        })
        .catch(error => {
          console.error('Failed to fetch drawers:', error);
        });
    }, [debounced_save]);

    // Update existing setDrawers calls
    useEffect(() => {
      debounced_save(drawers);
    }, [drawers, debounced_save]);

    const [search_term, set_search_term] = useState('');

    const handle_size_change = (drawer_id: string, new_size: DrawerSize) => {
      const drawer = drawers[drawer_id];
      const [row, start_col] = [drawer_id[0], parseInt(drawer_id.slice(1))];
      const is_right_section = start_col >= 10;
      const size_config = is_right_section ? SIZES.RIGHT : SIZES.LEFT;
      
      set_drawers(prev => {
        const newDrawers = { ...prev };
        if (drawer.is_right_section) {
          if (drawer.size === 'MEDIUM') {
            if (new_size === 'LARGE' && start_col < 15) {
              const absorbedId = `${row}${start_col + 1}`;
              delete newDrawers[absorbedId];
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'LARGE',
                positions: JSON.stringify([start_col, start_col + 1]),
                title: `${row}${start_col.toString().padStart(2, '0')},${(start_col + 1).toString().padStart(2, '0')}`,
                spacing: 0,
                updated_at: new Date()
              };
            } else if (new_size === 'SMALL') {
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'SMALL',
                positions: JSON.stringify([start_col]),
                title: `${row}${start_col.toString().padStart(2, '0')}`,
                spacing: size_config.SMALL.spacing,
                updated_at: new Date()
              };
            }
          } else if (drawer.size === 'LARGE') {
            if (new_size === 'MEDIUM') {
              // Convert LARGE drawer back to two MEDIUM drawers
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'MEDIUM',
                positions: JSON.stringify([start_col]),
                title: `${row}${start_col.toString().padStart(2, '0')}`,
                spacing: 0,
                updated_at: new Date()
              };
              
              const nextPos = start_col + 1;
              newDrawers[`${row}${nextPos}`] = {
                id: `${row}${nextPos}`,
                size: 'MEDIUM',
                title: `${row}${nextPos.toString().padStart(2, '0')}`,
                name: null,
                positions: JSON.stringify([nextPos]),
                is_right_section: true,
                keywords: JSON.stringify([]),
                spacing: 0,
                created_at: new Date(),
                updated_at: new Date()
              };
            } else if (new_size === 'SMALL') {
              // Convert LARGE back to one SMALL and one MEDIUM drawer
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'SMALL',
                positions: JSON.stringify([start_col]),
                title: `${row}${start_col.toString().padStart(2, '0')}`,
                spacing: size_config.SMALL.spacing,
                updated_at: new Date()
              };
              
              const nextPos = start_col + 1;
              newDrawers[`${row}${nextPos}`] = {
                id: `${row}${nextPos}`,
                size: 'MEDIUM',
                title: `${row}${nextPos.toString().padStart(2, '0')}`,
                name: null,
                positions: JSON.stringify([nextPos]),
                is_right_section: true,
                keywords: JSON.stringify([]),
                spacing: 0,
                created_at: new Date(),
                updated_at: new Date()
              };
            }
          } else if (drawer.size === 'SMALL') {
            if (new_size === 'MEDIUM') {
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'MEDIUM',
                positions: JSON.stringify([start_col]),
                title: `${row}${start_col.toString().padStart(2, '0')}`,
                spacing: 0,
                updated_at: new Date()
              };
            } else if (new_size === 'LARGE' && start_col < 15) {
              const nextDrawerId = `${row}${start_col + 1}`;
              delete newDrawers[nextDrawerId];
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'LARGE',
                positions: JSON.stringify([start_col, start_col + 1]),
                title: `${row}${start_col.toString().padStart(2, '0')},${(start_col + 1).toString().padStart(2, '0')}`,
                spacing: 0,
                updated_at: new Date()
              };
            }
          }
        } else {
          if (drawer.size === 'SMALL' && new_size === 'MEDIUM') {
            const nextDrawerId = `${row}${start_col + 1}`;
            const nextDrawer = newDrawers[nextDrawerId];
            delete newDrawers[nextDrawerId];
            
            newDrawers[drawer_id] = {
              ...drawer,
              size: 'MEDIUM',
              positions: JSON.stringify([start_col, start_col + 1]),
              title: `${row}${start_col.toString().padStart(2, '0')},${(start_col + 1).toString().padStart(2, '0')}`,
              spacing: size_config.MEDIUM.spacing,
              updated_at: new Date()
            };
          } else if (drawer.size === 'MEDIUM' && new_size === 'SMALL') {
            const nextCol = start_col + 1;
            newDrawers[drawer_id] = {
              ...drawer,
              size: 'SMALL',
              positions: JSON.stringify([start_col]),
              title: `${row}${start_col.toString().padStart(2, '0')}`,
              spacing: 0,
              updated_at: new Date()
            };
            
            newDrawers[`${row}${nextCol}`] = {
              id: `${row}${nextCol}`,
              size: 'SMALL',
              title: `${row}${nextCol.toString().padStart(2, '0')}`,
              name: null,
              positions: JSON.stringify([nextCol]),
              is_right_section: false,
              keywords: JSON.stringify([]),
              spacing: 0,
              created_at: new Date(),
              updated_at: new Date()
            };
          } else if (new_size === 'LARGE') {
            if (start_col + 2 <= 9) {
              const newPositions = [start_col, start_col + 1, start_col + 2];
              newPositions.slice(1).forEach(pos => {
                delete newDrawers[`${row}${pos}`];
              });
              
              newDrawers[drawer_id] = {
                ...drawer,
                size: 'LARGE',
                positions: JSON.stringify(newPositions),
                title: `${row}${newPositions.map(p => p.toString().padStart(2, '0')).join(',')}`,
                spacing: 0,
                updated_at: new Date()
              };
            }
          } else if (drawer.size === 'LARGE') {
            newDrawers[drawer_id] = {
              ...drawer,
              size: new_size,
              positions: JSON.stringify([start_col]),
              title: `${row}${start_col.toString().padStart(2, '0')}`,
              spacing: size_config[new_size].spacing,
              updated_at: new Date()
            };
            
            if (new_size === 'MEDIUM') {
              // Create one small drawer for the remaining space
              [1, 2].forEach((offset) => {
                const pos = start_col + offset;
                if (offset === 1) {
                  // First position becomes part of the MEDIUM drawer
                  const currentPositions = JSON.parse(newDrawers[drawer_id].positions);
                  newDrawers[drawer_id].positions = JSON.stringify([...currentPositions, pos]);
                  newDrawers[drawer_id].title = `${row}${start_col.toString().padStart(2, '0')},${pos.toString().padStart(2, '0')}`;
                } else {
                  // Second position becomes a new SMALL drawer
                  newDrawers[`${row}${pos}`] = {
                    id: `${row}${pos}`,
                    size: 'SMALL',
                    title: `${row}${pos.toString().padStart(2, '0')}`,
                    name: null,
                    positions: JSON.stringify([pos]),
                    is_right_section: false,
                    keywords: JSON.stringify([]),
                    spacing: 0,
                    created_at: new Date(),
                    updated_at: new Date()
                  };
                }
              });
            } else if (new_size === 'SMALL') {
              // Create two small drawers for the remaining space
              [1, 2].forEach((offset) => {
                const pos = start_col + offset;
                newDrawers[`${row}${pos}`] = {
                  id: `${row}${pos}`,
                  size: 'SMALL',
                  title: `${row}${pos.toString().padStart(2, '0')}`,
                  name: null,
                  positions: JSON.stringify([pos]),
                  is_right_section: false,
                  keywords: JSON.stringify([]),
                  spacing: 0,
                  created_at: new Date(),
                  updated_at: new Date()
                };
              });
            }
          } else if (drawer.size === 'SMALL' && new_size === ('LARGE' as DrawerSize) && start_col < 15) {
            const nextDrawerId = `${row}${start_col + 1}`;
            delete newDrawers[nextDrawerId];
            newDrawers[drawer_id] = {
              ...drawer,
              size: new_size,
              positions: JSON.stringify([start_col, start_col + 1]),
              title: `${row}${start_col.toString().padStart(2, '0')},${(start_col + 1).toString().padStart(2, '0')}`,
              spacing: 0,
              is_right_section: true,
              updated_at: new Date()
            };
          }
        }
        
        return newDrawers;
      });
    };
  
    const is_drawer_visible = (drawer: DrawerData) => {
      if (!drawer || !search_term) return true;
      const searchLower = search_term.toLowerCase().trim();
      const keywordArray = typeof drawer.keywords === 'string' ? 
        JSON.parse(drawer.keywords) : drawer.keywords;
      
      return (drawer.name?.toLowerCase().includes(searchLower) ||
              drawer.title.toLowerCase().includes(searchLower) ||
              keywordArray.some((keyword: string) => 
                keyword.toLowerCase().includes(searchLower)
              ));
    };

    const handle_drawer_update = (drawer_id: string, updated_drawer: DrawerData) => {
      set_drawers(prev => ({
        ...prev,
        [drawer_id]: updated_drawer
      }));
    };

    const DrawerModal = ({ drawer, onDrawerUpdate }: { drawer: DrawerData; onDrawerUpdate: (drawerId: string, updatedDrawer: DrawerData) => void }) => {
      const [show_advanced, set_show_advanced] = useState(false);
      const [name, setName] = useState(drawer.name || '');
      const [keywords, setKeywords] = useState(Array.isArray(drawer.keywords) ? drawer.keywords.join(', ') : drawer.keywords);
      const [local_size, set_local_size] = useState<DrawerSize>(drawer.size);
      const [preview_image, set_preview_image] = useState<string>();
      const [is_preview_open, set_is_preview_open] = useState(false);
      const size_config = drawer.is_right_section ? SIZES.RIGHT : SIZES.LEFT;
      const drawer_size = size_config[drawer.size];
      const current_spacing = (drawer.is_right_section && drawer.size === 'SMALL') || 
                            (!drawer.is_right_section && drawer.size === 'MEDIUM') 
                            ? size_config[drawer.size].spacing 
                            : drawer.spacing;

      const handle_save = () => {
        const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
        const updatedDrawer = {
          ...drawer,
          name,
          keywords: JSON.stringify(keywordArray),
          updated_at: new Date()
        };
        if (local_size !== drawer.size) {
          handle_size_change(drawer.id, local_size);
        } else {
          onDrawerUpdate(drawer.id, updatedDrawer);
        }
      };
      
      return (
        <>
          <div style={{ 
            display: 'flex', 
            width: `${drawer_size.width + current_spacing}px`,
            position: 'relative'
          }}>
            <Card 
              style={{
                width: `${drawer_size.width}px`,
                height: `${drawer_size.height}px`,
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
                ${is_drawer_visible(drawer) ? 'opacity-100' : 'opacity-30'}
              `}
            >
              <div className="absolute inset-0">
                {drawer.name ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <AutoResizingText 
                      text={drawer.name} 
                      width={drawer_size.width - 16} 
                      height={drawer_size.height - 16}
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
                      show_advanced ? '' : 'border'
                    }`}>
                      <Button
                        variant={show_advanced ? "ghost" : "outline"}
                        onClick={() => set_show_advanced(!show_advanced)}
                        className={`w-full justify-between ${
                          show_advanced ? 'rounded-t-lg border-b' : 'rounded-lg'
                        }`}
                      >
                        <span>Advanced Settings</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${show_advanced ? 'rotate-180' : ''}`} />
                      </Button>
                      
                      <div className={`space-y-4 px-4 transition-all duration-200 ${
                        show_advanced ? 'py-4 h-auto opacity-100' : 'h-0 opacity-0 overflow-hidden'
                      }`}>
                        <label className="text-sm font-medium">Size</label>
                        <div className="flex gap-2">
                          {Object.keys(size_config).map((size) => {
                            const positions = JSON.parse(drawer.positions);
                            const disabled = drawer.is_right_section ?
                              (size === 'LARGE' && positions[0] >= 15) :
                              (size !== 'SMALL' && 
                               positions[0] + SIZES.LEFT[size as keyof typeof SIZES.LEFT].span - 1 > 9);
                            return (
                              <Button
                                key={size}
                                variant={local_size === size ? "default" : "outline"}
                                onClick={() => set_local_size(size as DrawerSize)}
                                disabled={disabled}
                              >
                                {size_config[size as keyof typeof size_config].label}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 w-full">
                      <Button onClick={handle_save} className="flex-1">
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!name}
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/print', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                text: name || drawer.title
                              }),
                            });

                            const result = await response.json();

                            if (!response.ok) {
                              throw new Error(result.error || 'Operation failed');
                            }

                            if (result.imageData) {
                              set_preview_image(result.imageData);
                              set_is_preview_open(true);
                            } else {
                              toast.success('Label printed successfully');
                            }
                          } catch (error) {
                            toast.error('Operation failed. Please check your printer configuration.');
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
                height: `${drawer_size.height}px`,
                backgroundColor: 'transparent'
              }} />
            )}
          </div>
          
          <LabelPreviewModal
            is_open={is_preview_open}
            on_close={() => set_is_preview_open(false)}
            image_data={preview_image}
            on_print={async () => {
              try {
                const response = await fetch('/api/print', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    text: name || drawer.title
                  }),
                });

                const result = await response.json();
                if (!response.ok) {
                  throw new Error(result.error || 'Print failed');
                }
                
                toast.success('Label printed successfully');
                set_is_preview_open(false);
              } catch (error) {
                toast.error('Print failed. Please check your printer configuration.');
              }
            }}
          />
        </>
      );
    };
    
      const renderDrawerSection = (start_col: number, end_col: number) => {
        const colWidth = start_col >= 10 ? base_size.medium_base_width : base_size.width;
        return (
          <div>
            <div className="flex mb-2">
              <div className="w-6 mr-1" />  {/* Reduced from mr-2 to mr-1 */}
              <div className="flex">
                {COL_LABELS.slice(start_col - 1, end_col).map((col, index) => {
                  const colNumber = parseInt(col);
                  const cumulativeSpacing = start_col >= 10 
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
                .filter(d => {
                  const positions = JSON.parse(d.positions);
                  return d.id[0] === row && 
                         positions[0] >= start_col && 
                         positions[0] <= end_col;
                })
                .sort((a, b) => {
                  const posA = JSON.parse(a.positions)[0];
                  const posB = JSON.parse(b.positions)[0];
                  return posA - posB;
                });
    
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
                        onDrawerUpdate={handle_drawer_update}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      };
    
      if (!base_size.width || !base_size.medium_base_width) return null;
    
      return (
        <div className="h-screen p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-5 h-5 text-muted-foreground" />
            <div className="w-[600px]">
              <Input
                type="text"
                placeholder="Search drawers..."
                value={search_term}
                onChange={(e) => set_search_term(e.target.value)}
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
