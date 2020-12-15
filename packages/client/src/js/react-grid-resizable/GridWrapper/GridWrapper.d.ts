import { ReactElement } from 'react';
import { CellProps } from '../CellWrapper/Cell';
import { Direction } from '../hooks/useRefsWithInitialSize';
import { SeparatorDivProps } from '../Separators/Separator';
/**
 * Interface for extending this wrapper by providing specific direction
 */
export interface GridWrapperProps<P extends CellProps> {
    children?: ReactElement<P> | ReactElement<P>[];
    /**
     * Provide props to the separators of the grid
     */
    separatorProps?: SeparatorDivProps;
}
interface GridWrapperPropsWithDirection<P extends CellProps> extends GridWrapperProps<P> {
    direction: Direction;
}
export declare const GridWrapper: <P extends CellProps>(props: GridWrapperPropsWithDirection<P>) => JSX.Element;
export {};
