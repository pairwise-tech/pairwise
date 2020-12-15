import { CSSProperties, ReactElement } from 'react';
import { Direction } from '../hooks/useRefsWithInitialSize';
export interface SeparatorDivProps {
    style?: CSSProperties;
    className?: string;
    children?: ReactElement | ReactElement[];
    direction?: Direction;
}
interface SeparatorProps extends SeparatorDivProps {
    onDragStart: () => void;
    onDrag: (distance: number) => void;
}
export declare const Separator: (props: SeparatorProps) => JSX.Element;
export {};
