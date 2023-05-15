import React, {cloneElement} from 'react';

import {
    Filter,
    Datagrid,
    Edit,
    Create,
    CreateButton,
    TopToolbar,
    SimpleForm,
    TextField,
    EditButton,
    TextInput,
    Pagination, useNotify, useRefresh, useRedirect
} from 'react-admin';
import ListAltIcon from '@material-ui/icons/ListAlt';
import {CustomList as List} from '../components/CustomList/index.jsx';
import { exporter, ExportButtons } from '../utils/export.jsx';

export const TagIcon = ListAltIcon;

const ListTopToolbar = props => {
  const { data, basePath, resource, total } = props;
  return (
    <TopToolbar>
      <CreateButton basePath={basePath}/>
      <ExportButtons total={total} data={data} filename='tags'/>
    </TopToolbar>);
}

const TagFilters = (props) => (
  <Filter {...props}>
    {/*<TextInput label="Search" source="q" alwaysOn />*/}
    <TextInput label="Id" source="id" defaultValue="" />
  </Filter>
);

const TagPagination = props => <Pagination rowsPerPageOptions={[10, 25, 50, 100]} {...props} />;

export const TagList = (props) => (
  <List {...props} filters={<TagFilters />} title="Tags" pagination={<TagPagination />} sort={{field: 'id', order: 'DESC'}} actions={<ListTopToolbar/>}>
        <Datagrid>
            <TextField source="id" />
            <TextField source="name" />
            <TextField source="type" />
            <EditButton basePath="/tag" />
        </Datagrid>
    </List>
);

const TagTitle = ({ record }) => {
    return <span>Tag {record ? `"${record.name}"` : ''}</span>;
};

export const TagEdit = (props) => (
    <Edit mutationMode="pessimistic" title={<TagTitle />} {...props}>
        <SimpleForm>
          <TextInput isRequired={true} source="name" label="Tag name" variant="outlined" />
          <TextInput isRequired={false} source="type" label="Tag type" variant="outlined" />
        </SimpleForm>
    </Edit>
);

export const TagCreate = (props) => {
    const notify = useNotify();
    const refresh = useRefresh();
    const redirect = useRedirect();

  return <Create title="Tag toevoegen" {...props} onSuccess={() => {
      notify('ra.notification.created', 'info', {smart_count: 1});
      redirect('/tag');
      refresh()
  }}>
        <SimpleForm>
          <TextInput isRequired={true} source="name" label="Tag name" variant="outlined" />
          <TextInput isRequired={false} source="type" label="Tag type" variant="outlined" />
        </SimpleForm>
    </Create>
};
