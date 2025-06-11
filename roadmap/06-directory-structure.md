# Recommended Directory Structure

This document outlines the recommended directory structure for the Widget Dashboard Platform. This structure is designed to support modularity, testability, and extensibility.

## Overview

```
AnAppleADay/
├── src/                      # Frontend code
│   ├── lib/                  # Library code
│   │   ├── components/       # UI components
│   │   ├── core/             # Core system
│   │   │   ├── registry/     # Widget registry
│   │   │   ├── lifecycle/    # Widget lifecycle
│   │   │   ├── permissions/  # Permission system
│   │   │   ├── state/        # State management
│   │   │   └── communication/ # Widget communication
│   │   ├── services/         # Frontend services
│   │   │   ├── network/      # Network requests
│   │   │   ├── storage/      # Client-side storage
│   │   │   └── ipc/          # Tauri IPC
│   │   ├── widgets/          # Widget implementations
│   │   │   ├── base/         # Base classes/interfaces
│   │   │   ├── display/      # Display widgets
│   │   │   ├── interactive/  # Interactive widgets
│   │   │   ├── system/       # System widgets
│   │   │   └── external/     # External service widgets
│   │   └── utils/            # Utility functions
│   ├── routes/               # SvelteKit routes
│   │   ├── +layout.svelte    # Main layout
│   │   ├── +page.svelte      # Dashboard page
│   │   ├── settings/         # Settings pages
│   │   ├── gallery/          # Widget gallery
│   │   └── history/          # History and stats
│   └── app.html              # HTML template
├── src-tauri/                # Tauri backend
│   ├── src/                  # Rust code
│   │   ├── main.rs           # Entry point
│   │   ├── lib.rs            # Library exports
│   │   ├── commands/         # Tauri commands
│   │   │   ├── fs.rs         # Filesystem commands
│   │   │   ├── system.rs     # System commands
│   │   │   ├── network.rs    # Network commands
│   │   │   └── db.rs         # Database commands
│   │   ├── services/         # Backend services
│   │   │   ├── storage.rs    # Storage service
│   │   │   ├── settings.rs   # Settings service
│   │   │   └── widgets.rs    # Widget service
│   │   └── security/         # Security features
│   │       ├── permissions.rs # Permission enforcement
│   │       └── sandbox.rs    # Sandboxing
│   ├── Cargo.toml            # Rust dependencies
│   └── tauri.conf.json       # Tauri configuration
├── static/                   # Static assets
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── .github/                  # GitHub configuration
│   └── workflows/            # GitHub Actions
│       ├── ci.yml            # CI workflow
│       └── release.yml       # Release workflow
├── scripts/                  # Build/utility scripts
├── docs/                     # Documentation
│   ├── api/                  # API documentation
│   ├── user/                 # User guides
│   └── development/          # Developer guides
├── roadmap/                  # Project roadmap (this directory)
├── package.json              # Node dependencies
├── tsconfig.json             # TypeScript configuration
├── svelte.config.js          # Svelte configuration
├── vite.config.js            # Vite configuration
└── README.md                 # Project overview
```

## Key Directories

### Frontend (`src/`)

#### Core System (`src/lib/core/`)

Contains the fundamental infrastructure of the widget system:

- **registry/**: Widget registration and discovery
- **lifecycle/**: Widget creation, updates, and disposal
- **permissions/**: Permission management and enforcement
- **state/**: State management and persistence
- **communication/**: Inter-widget communication

#### Widgets (`src/lib/widgets/`)

Organized by widget type:

- **base/**: Common interfaces and abstract classes
- **display/**: Simple information display widgets
- **interactive/**: Widgets with user interaction
- **system/**: System integration widgets
- **external/**: Widgets that connect to external services

### Backend (`src-tauri/src/`)

Organized by functionality:

- **commands/**: Tauri command definitions
- **services/**: Backend service implementations
- **security/**: Security-related features

### Tests (`tests/`)

Separated by test type:

- **unit/**: Tests for individual components
- **integration/**: Tests for component interactions
- **e2e/**: Tests for full user flows

## Directory Structure Principles

1. **Separation of Concerns**: Each directory has a clear responsibility
2. **Modularity**: Components are organized into logical modules
3. **Discoverability**: File locations are intuitive
4. **Testability**: Structure facilitates comprehensive testing
5. **Scalability**: Can accommodate future growth

## Transition Strategy

To transition from the current project structure to this recommended structure:

1. Start by creating the core directories
2. Move existing Pomodoro timer code to the appropriate widget directory
3. Implement the core system components
4. Gradually refactor and reorganize as development progresses

## Best Practices

1. **Keep Related Files Together**: Components, tests, and styles
2. **Use Barrel Files**: Export related items from a single file
3. **Consistent Naming**: Follow naming conventions across the codebase
4. **Documentation**: Include README files in key directories
5. **Lazy Loading**: Structure for efficient code splitting