import { Set } from "immutable"
import { useState } from "react";
import { hitBoxHalfHeight, hitBoxHalfWidth } from "./Canvas";
import { nodeState } from "./graphHandler";

export class AABB {

  nodeIds: Set<string>
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  leafs: AABB[];

  constructor() {
    this.nodeIds = Set()
    this.minX = 0;
    this.minY = 0;
    this.maxX = 0;
    this.maxY = 0;
    this.leafs = [];
  }

  intersects(B: AABB) {
    return false
    // if (this.maxX === 0 && this.minX === 0) {
    //   return false
    // }
    // return this.maxX > B.minX && this.minX < B.maxX && this.maxY > B.minY && this.minY < B.maxY
  }

  
  copy() {
    return this;
    const newTree = new AABB()
    newTree.minX = this.minX
    newTree.minY = this.minY
    newTree.maxX = this.maxX
    newTree.maxY = this.maxY
    newTree.nodeIds = this.nodeIds
    newTree.leafs = [...this.leafs]
    return newTree
  }

  expand() {
    return;
    if (this.leafs.length === 2) {
      this.minX = Math.min(this.leafs[0]!.minX, this.leafs[1]!.minX)
      this.minY = Math.min(this.leafs[0]!.minY, this.leafs[1]!.minY)
      this.maxX = Math.max(this.leafs[0]!.maxX, this.leafs[1]!.maxX)
      this.maxY = Math.max(this.leafs[0]!.maxY, this.leafs[1]!.maxY)
    } else if (this.leafs.length === 1) {
      this.minX = this.leafs[0]!.minX
      this.minY = this.leafs[0]!.minY
      this.maxX = this.leafs[0]!.maxX
      this.maxY = this.leafs[0]!.maxY
    }
  }

  // create a leaf from a node, and add it to the graph
  addNode(node: nodeState, nodeId: string) {
    return this;
    const leaf = new AABB()
    leaf.minX = node.x - hitBoxHalfWidth,
    leaf.minY = node.y - hitBoxHalfHeight,
    leaf.maxX = node.x + hitBoxHalfWidth,
    leaf.maxY = node.y + hitBoxHalfHeight,
    leaf.nodeIds = leaf.nodeIds.add(nodeId)
    if (this.isLeafValid(leaf)) {
      return this.addLeaf(leaf)
    } else {
      return null
    }
  }

  // recursivly removes a node from the tree
  removeNode(nodeId: string) {// TODO: should probably read over this again lmao
    return this;
    if (!this.nodeIds.has(nodeId)) return this
    let tree = this.copy()
    tree.nodeIds = tree.nodeIds.delete(nodeId)

    this.leafs.forEach((leaf, index) => {
      if (leaf.nodeIds.has(nodeId) && leaf.nodeIds.size === 1) {
        tree = this.leafs[(index+1)%2]!
      } else if (leaf.nodeIds.has(nodeId)) {
        tree.leafs[index] = leaf.removeNode(nodeId)
      }
    })

    tree.expand()
    return tree

  }

  isLeafValid(leaf: AABB): boolean {
    return true
    if (!this.intersects(leaf)) {
      return true
    } else if (this.leafs.length < 2) {
      return false
    }
    else {
      const tree1 = this.leafs[0]!
      const tree2 = this.leafs[1]!
      return tree1.isLeafValid(leaf) && tree2.isLeafValid(leaf)
    }
  }
  
  // inserts a leaf into an appropriate position in the tree
  addLeaf(leaf: AABB) : AABB {
    return this;
    const tree = this.copy()
    if (tree.intersects(leaf)) {
      
      if (tree.leafs.length === 2) {
        const distance1 = (leaf.maxX - tree.leafs[0]!.maxX)**2 + (leaf.maxY - tree.leafs[0]!.maxY)**2
        const distance2 = (leaf.maxX - tree.leafs[1]!.maxX)**2 + (leaf.maxY - tree.leafs[1]!.maxY)**2
        if (distance1 < distance2) {
          tree.leafs[0] = tree.leafs[0]!.addLeaf(leaf)
        } else {
          tree.leafs[1] = tree.leafs[1]!.addLeaf(leaf)
        }
      } else {
        console.error("leafs length is not 2, it's ", tree.leafs.length)
      }

    } else { // tree is not intersecting the leaf
      if (tree.maxX === tree.maxY) {
        return leaf
      }
      tree.leafs = [this, leaf]
    }
    tree.expand()
    if (tree.leafs.length === 2) tree.nodeIds = tree.leafs[0]!.nodeIds.union(tree.leafs[1]!.nodeIds)
    return tree
  }

}

