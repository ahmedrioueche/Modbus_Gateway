#windowCreation

This document explains logic behind creating the windows for this app

##Introduction

Because we have to use IPC, we send a signal with a certain index from
the renderer processes to create each window.

##windows
0 => main window
1 => configuration window
2 => factory reset window
3 => diagnostics window
4 => packet window
5 => settings window
6 => help window
