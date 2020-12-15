/// <reference types="styled-components" />
import { CSSProperties, ReactElement } from 'react';
import { ForwardRefProps } from '../hooks/useRefsWithInitialSize';
import { ResizeDirectionOptions } from './ResizeDirectionOptions';
export declare type CellProps = ForwardRefProps<HTMLDivElement> & ResizeDirectionOptions & {
    children?: string | ReactElement<CellProps> | ReactElement<CellProps>[];
    style?: CSSProperties;
    className?: string;
    initialWidth?: number;
    initialHeight?: number;
};
export declare const Cell: import("styled-components").StyledComponentClass<CellProps, any, Pick<CellProps, "left" | "right" | "disabled" | "top" | "bottom" | "style" | "children" | "onRef" | "className" | "initialWidth" | "initialHeight"> & {
    theme?: any;
}>;
