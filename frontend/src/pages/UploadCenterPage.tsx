import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

type UploadStatus = 'queued' | 'uploading' | 'complete' | 'error';

type UploadItem = {
  id: string;
  name: string;
  sizeLabel: string;
  progress: number;
  status: UploadStatus;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const formatFileSize = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const statusColor = (status: UploadStatus): 'default' | 'info' | 'success' | 'error' => {
  switch (status) {
    case 'uploading':
      return 'info';
    case 'complete':
      return 'success';
    case 'error':
      return 'error';
    default:
      return 'default';
  }
};

const statusLabel = (status: UploadStatus) => {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'uploading':
      return 'Uploading';
    case 'complete':
      return 'Complete';
    case 'error':
      return 'Error';
    default:
      return status;
  }
};

const UploadCenterPage: React.FC = () => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [note, setNote] = useState('');

  const totals = useMemo(() => {
    const complete = items.filter((item) => item.status === 'complete').length;
    const uploading = items.filter((item) => item.status === 'uploading').length;
    const queued = items.filter((item) => item.status === 'queued').length;
    const error = items.filter((item) => item.status === 'error').length;
    return { complete, uploading, queued, error, total: items.length };
  }, [items]);

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;

    const nextItems: UploadItem[] = selectedFiles.map((file) => ({
      id: createId(),
      name: file.name,
      sizeLabel: formatFileSize(file.size),
      progress: 0,
      status: 'queued',
    }));

    setItems((current) => [...nextItems, ...current]);

    nextItems.forEach((item, index) => {
      const startDelay = 250 + index * 200;

      window.setTimeout(() => {
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'uploading', progress: 15 } : entry,
          ),
        );
      }, startDelay);

      window.setTimeout(() => {
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id ? { ...entry, status: 'uploading', progress: 55 } : entry,
          ),
        );
      }, startDelay + 700);

      window.setTimeout(() => {
        const shouldFail = item.name.toLowerCase().includes('fail');
        setItems((current) =>
          current.map((entry) =>
            entry.id === item.id
              ? {
                  ...entry,
                  status: shouldFail ? 'error' : 'complete',
                  progress: shouldFail ? 72 : 100,
                }
              : entry,
          ),
        );
      }, startDelay + 1500);
    });

    event.target.value = '';
  };

  const clearFinished = () => {
    setItems((current) => current.filter((item) => item.status !== 'complete'));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
            Upload Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Add files, track progress, and review upload outcomes in one place.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 2 }}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Add files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Select one or more files to simulate an upload workflow. Files with “fail” in the
                    name will be marked as errors.
                  </Typography>
                </Box>

                <Button
                  component="label"
                  variant="contained"
                  startIcon={<CloudUploadOutlinedIcon />}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Choose files
                  <input hidden multiple type="file" onChange={handleFilesSelected} />
                </Button>

                <TextField
                  label="Upload note"
                  placeholder="Optional context for this upload batch"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  fullWidth
                  multiline
                  minRows={3}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Summary
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                <Chip label={`Total ${totals.total}`} />
                <Chip color="info" label={`Uploading ${totals.uploading}`} />
                <Chip color="success" label={`Complete ${totals.complete}`} />
                <Chip color="error" label={`Errors ${totals.error}`} />
                <Chip label={`Queued ${totals.queued}`} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {note.trim()
                  ? `Current batch note: ${note.trim()}`
                  : 'No batch note added yet.'}
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  Upload queue
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Review live progress for each selected file.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={clearFinished} disabled={totals.complete === 0}>
                Clear completed
              </Button>
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {items.length === 0 ? (
              <Alert severity="info">No files have been added yet.</Alert>
            ) : (
              <List disablePadding>
                {items.map((item, index) => (
                  <Box key={item.id}>
                    <ListItem disableGutters sx={{ py: 1.5, alignItems: 'flex-start' }}>
                      <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                        <InsertDriveFileOutlinedIcon color="action" sx={{ mt: 0.25 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', sm: 'center' }}
                            spacing={1}
                            sx={{ mb: 1 }}
                          >
                            <ListItemText
                              primary={
                                <Typography variant="subtitle1" noWrap fontWeight={600}>
                                  {item.name}
                                </Typography>
                              }
                              secondary={item.sizeLabel}
                              sx={{ m: 0 }}
                            />
                            <Chip size="small" color={statusColor(item.status)} label={statusLabel(item.status)} />
                          </Stack>

                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            color={item.status === 'error' ? 'error' : 'primary'}
                            sx={{ height: 8, borderRadius: 999 }}
                          />

                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mt: 1 }}
                          >
                            <Typography variant="caption" color="text.secondary">
                              {item.progress}%
                            </Typography>
                            {item.status === 'complete' && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <CheckCircleOutlineIcon color="success" fontSize="small" />
                                <Typography variant="caption" color="success.main">
                                  Upload finished
                                </Typography>
                              </Stack>
                            )}
                            {item.status === 'error' && (
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <ErrorOutlineIcon color="error" fontSize="small" />
                                <Typography variant="caption" color="error.main">
                                  Upload failed
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </ListItem>
                    {index < items.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default UploadCenterPage;
