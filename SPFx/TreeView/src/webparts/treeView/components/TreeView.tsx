import * as React from 'react';
import { Spinner, SpinnerType } from 'office-ui-fabric-react/lib/Spinner';
import styles from './TreeView.module.scss';
import { ITreeViewProps } from './ITreeViewProps';
import { escape } from '@microsoft/sp-lodash-subset';

import { ITreeViewState } from './ITreeViewState';
import { ITreeItem } from './ITreeItem';
import TreeItem from './TreeItem';
import { Checkbox } from 'office-ui-fabric-react/lib/Checkbox';

export default class TreeView extends React.Component<ITreeViewProps, ITreeViewState> {
  private _treeItems: ITreeItem[];

  constructor(props: ITreeViewProps) {
    super(props);

    this._treeItems = this.props.TreeItems;
    this.state = {
      loaded: true,
      defaultCollapsed: this.props.defaultCollapsed
    };
    this._handleClick = this._handleClick.bind(this);
  }

  private groupBy(list, keyGetter) {
    const map = new Map();

    list.forEach((item) => {
      const key = keyGetter(item);
      const collection = map.get(key);

      if (!collection) {
        map.set(key, [item]);
      } 
      else {
        collection.push(item);
      }
    });

    return map;
  }

  public createChildrenNodes = (list, paddingLeft) => {
    if (list.length) {
      let childrenWithHandlers = list.map((item, index) => {
        return (
          <TreeItem
            key={index}
            label={item.Name}
            data={item.children}
            defaultCollapsed={this.state.defaultCollapsed}
            createChildrenNodes={this.createChildrenNodes}
            leftOffset={paddingLeft}
            isFirstRender={!paddingLeft ? true : false} // TODO: make better usage of this logic or remove it
          />
        );
      });

      return childrenWithHandlers;
    }
  }

  /**
   * Build a Tree structure from flat array with below logic:
   * 1. Iterate through the data array
   * 2. Find the parent element of the current element
   * 3. In the parent element's object, add a reference to the child
   * 4. If there is no parent for an element, we know that will be our tree's "root" element
   * Reference: https://typeofnan.dev/an-easy-way-to-build-a-tree-with-object-references/
   */
  private buildTreeStructure(): any {
    // Create a mapping of our element IDs to array index. This will help us to add references to an element's parent.
    const idMapping = this._treeItems.reduce((acc, el, i) => {
      acc[el.Id] = i;
      return acc;
    }, {});

    // Iterate through the object and assign references to each item's parent. 
    // Use idMapping to help locate the parent.
    let root: any;

    this._treeItems.forEach(el => {
      // Handle the root element
      if (el.ParentId === undefined || el.ParentId === null) {
        root = el;
        return;
      }

      // Use our mapping to locate the parent element in our data array
      const parentEl = this._treeItems[idMapping[el.ParentId]];
      
      // Add our current el to its parent's `children` array
      parentEl.children = [...(parentEl.children || []), el];
    });

    return root;
  }

  /**
   * Default React render method
   */
  public render(): JSX.Element {
    let root: any = this.buildTreeStructure();      

    return (
      <React.Fragment>
        <TreeItem
          key={root.Id}
          label={root.Name}
          data={root.children}
          createChildrenNodes={this.createChildrenNodes}
          leftOffset={20}
          isFirstRender={true}
          defaultCollapsed={false}
        />
      </React.Fragment>
    );
  }

  /**
   * Handle the click event: collapse or expand
   */
  private _handleClick() {
    this.setState({
      defaultCollapsed: !this.state.defaultCollapsed
    });
  }

  /**
   * The tree view selection changed
   */
  private treeViewSelectionChange = (ev: React.FormEvent<HTMLElement>, isChecked: boolean): void => {
    // this.props.termSetSelectedChange(this.props.termset, isChecked);
  }
}