

# Old Nodify

This is the original concept for Nodify, a task management app with dependency graphs and countdowns at it's core. 


This project is no longer maintained as I have turned my focus to the new redesign. I am very aware that it's buggy and lacks polish. 

![image](https://user-images.githubusercontent.com/34604972/198911010-620e0b89-d9fb-4ac7-8043-7a7fea83869c.png)


### Why did you abandon this version?

t'is the fate of the first concept. It's not a very user friendly interface. I have taken the lessons I've learnt from this project, and applying them to create something better, coming soon™

### Is the site still up?

if you try to login, you'll be stuck on a loading screen for database reasons. So, no

However, **you can still try out a static demo [here](https://old.nodify.dev/demo)** without having to login. 

## Features: 
- natural controls (you can scroll around, hold `ctrl` to zoom or arrow keys)
  - you can hold space or select the move tool to be able to move by dragging instead
- you can double click a node to focus it
- you can hold and drag nodes to move them around
- if you drag a node inside of another's bounding box, your action should be undone
- you can select a group of nodes by selecting an area that contains them
- you can delete selected nodes with `del`
- you can create, toggle and delete layers through the graph settings tab
- there is a special "complete" layer that marks nodes as complete when they are added to it.
- you can toggle layers with the number keys, the complete layer is always `1`
- the complete tool adds a node you click to the complete layer
- you can add directional edges, that represent dependencies
- if you try to create a cycle, Nodify will stop you
- you can see a list of leaf nodes (nodes with no incomplete dependencies)
- you can focus a random leaf node with the dice button
- you can see all nodes in collapsible tree if you select the tree option.
- you can set due dates
- due dates cascade to children nodes
- you can see a countdown timer on top of nodes 
- and probably more that I don't remember...
