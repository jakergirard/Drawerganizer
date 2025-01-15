'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, ChevronDown, Printer } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { LabelPreviewModal } from './label-preview-modal';
import { logger } from '@/lib/logger';
import { Textfit } from 'react-textfit';

/* eslint-disable react-hooks/exhaustive-deps */

// Replace lodash debounce with a custom implementation
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Optimize constant arrays
const ROW_LABELS = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));
const COL_LABELS = Array.from({ length: 15 }, (_, i) => `${i + 1}`.padStart(2, '0'));
const DRAWER_GAP = 4;

// Memoize size calculations
const calculateDrawerSizes = (
    viewport_width: number,
    viewport_height: number,
    padding = 48,
    top_space = 80,
    row_label_width = 24
): BaseSize => {
    const total_width = Math.max(0, viewport_width - padding);
    const section_width = Math.max(0, (total_width - (row_label_width * 3)) / 2);
    
    const small_drawer_width = Math.max(0, (section_width - (8 * DRAWER_GAP)) / 9);
    const medium_drawer_width = Math.max(0, (section_width - (5 * DRAWER_GAP)) / 6);
    
    const available_height = Math.max(0, viewport_height - padding - top_space);
    const drawer_height = Math.max(0, (available_height - (11 * DRAWER_GAP)) / 12);
    
    return {
        width: small_drawer_width,
        medium_base_width: medium_drawer_width,
        height: drawer_height
    };
};

// Optimize text resizing with binary search
const calculateOptimalFontSize = (
    element: HTMLDivElement,
    width: number,
    height: number,
    min_size = 6,
    max_size = 14,
    hasLineBreaks: boolean
): number => {
    let optimal_size = max_size;

    while (min_size <= max_size) {
        const mid = Math.floor((min_size + max_size) / 2);
        element.style.fontSize = `${mid}px`;
        
        const contentFits = element.scrollHeight <= height && element.scrollWidth <= width;

        if (contentFits) {
            optimal_size = mid;
            min_size = mid + 1;
        } else {
            max_size = mid - 1;
        }
    }

    return optimal_size;
};

// Optimize drawer filtering
const filterDrawers = (drawers: DrawerData[], searchTerm: string): DrawerData[] => {
    if (!searchTerm) return drawers;
    
    const searchLower = searchTerm.toLowerCase().trim();
    return drawers.filter(drawer => {
        if (drawer.name?.toLowerCase().includes(searchLower)) return true;
        if (drawer.title.toLowerCase().includes(searchLower)) return true;
        try {
            const keywords = JSON.parse(drawer.keywords) as string[];
            return keywords.some(k => k.toLowerCase().includes(searchLower));
        } catch {
            return false;
        }
    });
};

const AutoResizingText = React.memo(({ text, width, height }: { text: string, width: number, height: number }) => {
  const hasLineBreaks = text.includes('\n');

  return (
    <div style={{
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      padding: '0.5%'
    }}>
      <Textfit
        mode={hasLineBreaks ? "multi" : "single"}
        forceSingleModeWidth={!hasLineBreaks}
        min={1}
        max={12}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          whiteSpace: 'pre',
          textAlign: 'center',
          lineHeight: hasLineBreaks ? '1.2' : 'normal'
        }}
        className="text-foreground"
      >
        {text}
      </Textfit>
    </div>
  );
});

AutoResizingText.displayName = 'AutoResizingText';

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

// Move type declarations to the top
type DrawerSize = 'SMALL' | 'MEDIUM' | 'LARGE';

interface DrawerData {
    id: string;
    size: DrawerSize;
    title: string;
    name: string | null;
    positions: string;  // Keep as string for consistency with DB
    is_right_section: boolean;
    keywords: string;  // Keep as string for consistency with DB
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

interface DrawerModalProps {
    drawer: DrawerData;
    onDrawerUpdate: (drawerId: string, updatedDrawer: DrawerData) => void;
    sizeConfig: Record<DrawerSize, SizeConfig>;
    handleSizeChange: (drawerId: string, newSize: DrawerSize) => void;
    SIZES: Sizes;
    isSearchMatch?: boolean;
    search_term: string;
}

// Add at the top with other type declarations

// Use the imported type for variants

type ButtonVariantProps = VariantProps<typeof buttonVariants>;
type ButtonVariant = NonNullable<ButtonVariantProps['variant']>;

const DrawerModal = React.memo(({ 
    drawer, 
    onDrawerUpdate,
    sizeConfig,
    handleSizeChange,
    SIZES,
    isSearchMatch,
    search_term
}: DrawerModalProps) => {
    const [show_advanced, set_show_advanced] = useState(false);
    const [name, setName] = useState(drawer.name || '');
    const [is_dialog_open, set_is_dialog_open] = useState(false);
    const [keywords, setKeywords] = useState(() => {
      if (!drawer.keywords) return '';
      try {
        const parsed = JSON.parse(drawer.keywords);
        return Array.isArray(parsed) ? parsed.join(', ') : '';
      } catch {
        return drawer.keywords;
      }
    });
    const [local_size, set_local_size] = useState<DrawerSize>(drawer.size);
    const [preview_image, set_preview_image] = useState<string>();
    const [is_preview_open, set_is_preview_open] = useState(false);
    const [name_error, set_name_error] = useState<string | null>(null);

    const validateAndSetName = (value: string) => {
        const lines = value.split('\n');
        if (lines.length > 5) {
            set_name_error('Maximum 5 lines allowed');
            return;
        }
        
        const hasLongLine = lines.some(line => line.length > 20);
        if (hasLongLine) {
            set_name_error('Maximum 20 characters per line');
            return;
        }

        set_name_error(null);
        setName(value);
    };

    const drawer_size = sizeConfig[drawer.size];
    const current_spacing = (drawer.is_right_section && drawer.size === 'SMALL') || 
                          (!drawer.is_right_section && drawer.size === 'MEDIUM') 
                        ? sizeConfig[drawer.size].spacing 
                          : drawer.spacing;

    const handle_save = useCallback(() => {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k !== '');
      const updatedDrawer = {
        ...drawer,
        name,
        keywords: keywordArray.length > 0 ? JSON.stringify(keywordArray) : '',
        updated_at: new Date()
      };
      if (local_size !== drawer.size) {
            handleSizeChange(drawer.id, local_size);
      } else {
        onDrawerUpdate(drawer.id, updatedDrawer);
      }
      set_is_dialog_open(false);
    }, [drawer, name, keywords, local_size, handleSizeChange, onDrawerUpdate]);

    const handle_print = useCallback(async () => {
        try {
            const response = await fetch('/api/print', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: name || drawer.title,
                    force_print: is_preview_open
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
    }, [name, drawer.title, is_preview_open]);
    
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
              position: 'relative',
              padding: '2px',
              borderWidth: '1px'
            }}
            className={`cursor-pointer transition-colors duration-200 hover:bg-gray-700 ${
              search_term && !isSearchMatch ? 'opacity-30' : ''
            }`}
          >
            <div className="absolute inset-0 p-1">
              {drawer.name ? (
                <div className="w-full h-full flex items-center justify-center">
                  <AutoResizingText 
                    text={drawer.name} 
                    width={drawer_size.width - 4}
                    height={drawer_size.height - 4}
                  />
                </div>
              ) : (
                <div className="absolute top-1 left-2 text-xs text-muted-foreground opacity-50">
                  {drawer.title}
                </div>
              )}
            </div>
            <Dialog open={is_dialog_open} onOpenChange={set_is_dialog_open}>
              <DialogTrigger asChild>
                <div className="absolute inset-0" onClick={() => set_is_dialog_open(true)} />
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
                      onChange={(e) => validateAndSetName(e.target.value)}
                      placeholder="Enter drawer name"
                      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                        name_error ? 'border-red-500' : ''
                      }`}
                    />
                    {name_error ? (
                        <p className="text-xs text-red-500">{name_error}</p>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            Maximum 5 lines, 20 characters per line. Use line breaks for multi-line text.
                        </p>
                    )}
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
                                            {Object.keys(sizeConfig).map((size) => {
                          const positions = JSON.parse(drawer.positions);
                          const disabled = drawer.is_right_section ?
                            (size === 'LARGE' && positions[0] >= 15) :
                            (size !== 'SMALL' && 
                                                     positions[0] + sizeConfig[size as keyof typeof sizeConfig].span - 1 > 9);
                          return (
                            <Button
                              key={size}
                              variant={local_size === size ? "default" : "outline"}
                              onClick={() => set_local_size(size as DrawerSize)}
                              disabled={disabled}
                            >
                                                        {sizeConfig[size as keyof typeof sizeConfig].label}
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
                      onClick={handle_print}
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
        
        {is_preview_open && (
          <LabelPreviewModal
            is_open={is_preview_open}
            on_close={() => set_is_preview_open(false)}
            image_data={preview_image}
            text={name || drawer.title}
          />
        )}
      </>
    );
});

DrawerModal.displayName = 'DrawerModal';

// DrawerSection component for rendering a section of drawers
interface DrawerSectionProps {
    start_col: number;
    end_col: number;
    drawers: DrawerData[];
    base_size: BaseSize;
    SIZES: Sizes;
    onDrawerUpdate: (drawerId: string, updatedDrawer: DrawerData) => void;
    handleSizeChange: (drawerId: string, newSize: DrawerSize) => void;
    filtered_drawer_ids: Set<string>;
    search_term: string;
}

const DrawerSection = React.memo(({ 
    start_col, 
    end_col, 
    drawers, 
    base_size,
    SIZES,
    onDrawerUpdate,
    handleSizeChange,
    filtered_drawer_ids,
    search_term
}: DrawerSectionProps & { filtered_drawer_ids: Set<string>; search_term: string }) => {
    const colWidth = start_col >= 10 ? base_size.medium_base_width : base_size.width;

    const sectionDrawers = useMemo(() => 
        drawers.filter(d => {
            const positions = JSON.parse(d.positions);
            return d.id[0] >= 'A' && d.id[0] <= 'L' && 
                   positions[0] >= start_col && 
                   positions[0] <= end_col;
        }).sort((a, b) => {
            const posA = JSON.parse(a.positions)[0];
            const posB = JSON.parse(b.positions)[0];
            return posA - posB;
        }),
        [drawers, start_col, end_col]
    );

    return (
        <div className="flex flex-col">
            <div className="flex mb-2">
                <div className="w-6 mr-1" />
                <div className="flex">
                    {COL_LABELS.slice(start_col - 1, end_col).map((col, index) => {
                        const cumulativeSpacing = index * DRAWER_GAP;
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
                const rowDrawers = sectionDrawers.filter(d => d.id[0] === row);
                return (
                    <div 
                        key={row} 
                        className="flex" 
                        style={{ marginBottom: `${DRAWER_GAP}px` }}
                    >
                        <div className="w-6 flex items-center justify-center text-gray-400 mr-1">
                            {row}
                        </div>
                        <div className="flex">
                            {rowDrawers.map(drawer => (
                                <DrawerModal
                                    key={drawer.id}
                                    drawer={drawer}
                                    onDrawerUpdate={onDrawerUpdate}
                                    sizeConfig={drawer.is_right_section ? SIZES.RIGHT : SIZES.LEFT}
                                    handleSizeChange={handleSizeChange}
                                    SIZES={SIZES}
                                    isSearchMatch={filtered_drawer_ids.has(drawer.id)}
                                    search_term={search_term}
                                />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

DrawerSection.displayName = 'DrawerSection';

export function DrawerGrid() {
    const [base_size, set_base_size] = useState<BaseSize>({ 
        width: 0, 
        height: 0, 
        medium_base_width: 0 
    });
    const [drawers, set_drawers] = useState<Record<string, DrawerData>>({});
    const [loading, set_loading] = useState(true);
    const [search_term, set_search_term] = useState('');
    const initialized = useRef(false);
    const resize_timeout = useRef<NodeJS.Timeout>();

    const calculate_base_size = useCallback(() => {
        if (resize_timeout.current) {
            clearTimeout(resize_timeout.current);
        }

        resize_timeout.current = setTimeout(() => {
            const sizes = calculateDrawerSizes(window.innerWidth, window.innerHeight);
            set_base_size(sizes);
        }, 100);
    }, []);

    const SIZES = useMemo<Sizes>(() => ({
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
                width: (base_size.width * 3),
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
                spacing: base_size.medium_base_width * 0.25
            },
            MEDIUM: {
                width: base_size.medium_base_width,
                height: base_size.height,
                label: 'Medium',
                span: 1,
                spacing: 0
            },
            LARGE: {
                width: base_size.medium_base_width * 2,
                height: base_size.height,
                label: 'Large',
                span: 2,
                spacing: 0
            }
        }
    }), [base_size]);

    const debounced_save = useCallback(
        debounce(async (drawers_data: Record<string, DrawerData>) => {
            try {
                const serializedDrawers = Object.values(drawers_data).map(drawer => ({
                    ...drawer,
                    positions: drawer.positions,
                    keywords: drawer.keywords,
                    is_right_section: Boolean(drawer.is_right_section)
                }));
                
                const response = await fetch('/api/drawers', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(serializedDrawers),
                });

                if (!response.ok) {
                    throw new Error('Failed to save drawers');
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                logger.error('Failed to save drawers:', new Error(errorMessage));
                toast.error('Failed to save changes. Please try again.');
            }
        }, 1000),
        []
    );

    // Initialization effect
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const fetchDrawers = async () => {
            try {
                set_loading(true);
                const response = await fetch('/api/drawers', { 
                    method: 'GET',
                    headers: {
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch drawers: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();

                if (Array.isArray(data) && data.length > 0) {
                    const drawersMap = data.reduce((acc: Record<string, DrawerData>, drawer: any) => {
                        try {
                            acc[drawer.id] = {
                                ...drawer,
                                positions: drawer.positions,
                                keywords: drawer.keywords,
                                is_right_section: Boolean(drawer.is_right_section),
                                created_at: new Date(drawer.created_at),
                                updated_at: new Date(drawer.updated_at)
                            };
                        } catch (error) {
                            logger.error(`Failed to parse drawer data for ${drawer.id}:`, error instanceof Error ? error : new Error(String(error)));
                        }
                        return acc;
                    }, {});

                    set_drawers(drawersMap);
                } else {
                    // Initialize with default drawers if none exist
                    const initial: Record<string, DrawerData> = {};
                    ROW_LABELS.forEach(row => {
                        for (let col = 1; col <= 9; col++) {
                            initial[`${row}${col}`] = {
                                id: `${row}${col}`,
                                size: 'SMALL',
                                title: `${row}${col.toString().padStart(2, '0')}`,
                                name: null,
                                positions: JSON.stringify([col]),
                                is_right_section: false,
                                keywords: '',
                                spacing: 0,
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                        }
                        for (let col = 10; col <= 15; col++) {
                            initial[`${row}${col}`] = {
                                id: `${row}${col}`,
                                size: 'MEDIUM',
                                title: `${row}${col.toString().padStart(2, '0')}`,
                                name: null,
                                positions: JSON.stringify([col]),
                                is_right_section: true,
                                keywords: '',
                                spacing: 0,
                                created_at: new Date(),
                                updated_at: new Date()
                            };
                        }
                    });
                    set_drawers(initial);
                    await debounced_save(initial);
                }
            } catch (error) {
                logger.error('Failed to fetch drawers:', error instanceof Error ? error : new Error(String(error)));
                toast.error('Failed to load drawers. Please refresh the page.');
            } finally {
                set_loading(false);
            }
        };

        fetchDrawers();
        calculate_base_size();
        window.addEventListener('resize', calculate_base_size);
        return () => window.removeEventListener('resize', calculate_base_size);
    }, [calculate_base_size, debounced_save]);

    // Save effect
    useEffect(() => {
        if (!loading && Object.keys(drawers).length > 0) {
            debounced_save(drawers);
        }
    }, [drawers, debounced_save, loading]);

    const handle_drawer_update = useCallback((drawer_id: string, updated_drawer: DrawerData) => {
        set_drawers(prev => ({
            ...prev,
            [drawer_id]: updated_drawer
        }));
    }, []);

    const handle_size_change = useCallback((drawer_id: string, new_size: DrawerSize) => {
        const drawer = drawers[drawer_id];
        const [row, start_col] = [drawer_id[0], parseInt(drawer_id.slice(1))];
        const is_right_section = start_col >= 10;
        const size_config = is_right_section ? SIZES.RIGHT : SIZES.LEFT;
        
        set_drawers(prev => {
            const newDrawers = { ...prev };
            const current_positions = JSON.parse(drawer.positions) as number[];
            let updated_positions = [start_col];
            let affected_positions: number[] = [];

            // Calculate positions based on new size
            if (is_right_section) {
                if (new_size === 'LARGE' && start_col < 15) {
                    updated_positions = [start_col, start_col + 1];
                    affected_positions = [start_col + 1];
                }
            } else {
                if (new_size === 'MEDIUM' && start_col < 9) {
                    updated_positions = [start_col, start_col + 1];
                    affected_positions = [start_col + 1];
                } else if (new_size === 'LARGE' && start_col < 8) {
                    updated_positions = [start_col, start_col + 1, start_col + 2];
                    affected_positions = [start_col + 1, start_col + 2];
                }
            }

            // Update the main drawer
            const updated_drawer = {
                ...drawer,
                size: new_size,
                positions: JSON.stringify(updated_positions),
                title: updated_positions.map(pos => `${row}${pos.toString().padStart(2, '0')}`).join(','),
                spacing: size_config[new_size].spacing,
                updated_at: new Date()
            };
            newDrawers[drawer_id] = updated_drawer;

            // Remove affected drawers
            affected_positions.forEach(pos => {
                const affected_id = `${row}${pos}`;
                if (newDrawers[affected_id]) {
                    delete newDrawers[affected_id];
                }
            });

            // When changing back to a smaller size, restore affected drawers
            if (current_positions.length > updated_positions.length) {
                const positions_to_restore = current_positions.slice(updated_positions.length);
                positions_to_restore.forEach(pos => {
                    const restored_id = `${row}${pos}`;
                    newDrawers[restored_id] = {
                        id: restored_id,
                        size: is_right_section ? 'MEDIUM' : 'SMALL',
                        title: `${row}${pos.toString().padStart(2, '0')}`,
                        name: null,
                        positions: JSON.stringify([pos]),
                        is_right_section,
                        keywords: '',
                        spacing: is_right_section ? SIZES.RIGHT.MEDIUM.spacing : 0,
                        created_at: new Date(),
                        updated_at: new Date()
                    };
                });
            }

            return newDrawers;
        });
    }, [drawers, SIZES]);

    const filtered_drawer_ids = useMemo(() => 
        new Set(filterDrawers(Object.values(drawers), search_term).map(d => d.id)),
        [drawers, search_term]
    );

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-lg">Loading drawers...</div>
            </div>
        );
    }
  
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
            <div className="flex gap-2">
                <DrawerSection
                    start_col={1}
                    end_col={9}
                    drawers={Object.values(drawers)}
                    base_size={base_size}
                    SIZES={SIZES}
                    onDrawerUpdate={handle_drawer_update}
                    handleSizeChange={handle_size_change}
                    filtered_drawer_ids={filtered_drawer_ids}
                    search_term={search_term}
                />
                <DrawerSection
                    start_col={10}
                    end_col={15}
                    drawers={Object.values(drawers)}
                    base_size={base_size}
                    SIZES={SIZES}
                    onDrawerUpdate={handle_drawer_update}
                    handleSizeChange={handle_size_change}
                    filtered_drawer_ids={filtered_drawer_ids}
                    search_term={search_term}
                />
            </div>
        </div>
    );
}

// Wrap the export with ErrorBoundary
export default function DrawerGridWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <DrawerGrid />
    </ErrorBoundary>
  );
}
