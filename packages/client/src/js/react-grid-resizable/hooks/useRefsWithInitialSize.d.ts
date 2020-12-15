import { ReactElement, Ref } from 'react';
interface RefWithInitialSize<T extends HTMLElement> {
    element: T;
    initialSize: number;
}
export interface ForwardRefProps<T> {
    onRef?: Ref<T>;
}
interface RefsWithInitialSizeHook<T extends HTMLElement> {
    getRef: (index: number) => RefWithInitialSize<T>;
    setRef: (index: number, element: T) => void;
    /**
     * Update the initial size of the element
     */
    resetRef: (index: number) => void;
    /**
     * Clone the children and pass `onRef` props to record the element ref.
     */
    childrenWithRef: <P extends ForwardRefProps<T>>(children: ReactElement<P> | ReactElement<P>[]) => ReactElement<P>[];
}
export declare type Direction = 'horizontal' | 'vertical';
/**
 * Creates a ref that save the `dom element` and the `initial size` for a list of elements. *
 * @param direction ["horizontal"|"vertical"] Direction to save initial size. `horizontal` uses `width` | `vertical` uses `height`.
 */
export declare const useRefsWithInitialSize: <T extends HTMLElement>(direction: "horizontal" | "vertical") => RefsWithInitialSizeHook<T>;
export {};
