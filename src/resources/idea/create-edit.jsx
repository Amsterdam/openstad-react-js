import {
  Create,
  Edit,
  Toolbar,
  SaveButton,
  DeleteButton,
  FormTab,
  ReferenceArrayInput,
  ReferenceInput,
  SelectArrayInput,
  TabbedForm,
  TextInput,
  required,
  getResources,
  useQuery,
  Loading,
  AutocompleteInput,
  Error,
  useNotify,
    useRefresh,
    useRedirect,
} from 'react-admin';
import JsonInput from '../../form-fields/JsonInput.jsx';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';

import FileUpload from '../../form-fields/FileUpload.jsx';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
  },
});

const IdeaTitle = ({ record }) => {
  return <span>Idea {record ? `"${record.title}"` : ''}</span>;
};


// , maxLength(5000), minLength(140)
// @todo set up redux to access site rest object
const Form = (props) => (
  <TabbedForm {...props}  >
    <FormTab label="Info">
      {props.edit && <TextInput disabled source="id"/>}
      <ReferenceInput
        label="User"
        source="userId"
        reference="user"
        variant="outlined"
        perPage={25}
        filterToQuery={searchText => ({ email: {'substring': searchText} })}
        filter={{ role: {'!=': 'anonymous'} }}
        sort={{ field: 'email', order: 'ASC' }}
      >
          <AutocompleteInput optionText="email" />
      </ReferenceInput>
      <TextInput source="title" variant="outlined" fullWidth/>
      <TextInput source="summary" options={{ multiLine: true }} variant="outlined" fullWidth validate={[required()]} />
      <TextInput multiline source="description" variant="outlined" fullWidth validate={[required()]}/>
      <TextInput source="budget" variant="outlined" fullWidth/>
      <TextInput placeholder='The id of the original idea' label="Original idea-id" source="extraData.originalId" variant="outlined" fullWidth/>
      <ReferenceArrayInput label="tags" source="tags" reference="tag" variant="outlined">
        <SelectArrayInput optionText="name"/>
      </ReferenceArrayInput>
      <FileUpload resourceProps={props} imageApiUrl={props.options.imageApiUrl}/>
    </FormTab>
    <FormTab label=" Extradata">
      {props.edit && <TextInput disabled source="id"/>}
      <JsonInput source="extraData"/>
    </FormTab>
    {/*<FormTab label="Comments">
      <ReferenceManyField
        reference="argument"
        target="ideaId"
        addLabel={false}
        pagination={<Pagination/>}
        fullWidth
      >
        <Datagrid>
          <TextField source="id"/>
          <TextField source="description"/>
          <FunctionField label="Author" render={record => `${record.user.firstName} ${record.user.lastName}`}/>
          <DateField source="createdAt"/>
          <EditButton basePath="/Argument"/>
        </Datagrid>
      </ReferenceManyField>
    </FormTab>*/}
    {/*<FormTab label="Votes">*/}
    {/*  <ReferenceManyField*/}
    {/*    reference="vote"*/}
    {/*    target="ideaId"*/}
    {/*    addLabel={false}*/}
    {/*    pagination={<Pagination/>}*/}
    {/*    fullWidth*/}
    {/*  >*/}
    {/*    <Datagrid>*/}
    {/*      <TextField source="id"/>*/}
    {/*      <TextField source="userId"/>*/}
    {/*      <DateField source="createdAt"/>*/}
    {/*      <EditButton basePath="/Vote"/>*/}
    {/*    </Datagrid>*/}
    {/*  </ReferenceManyField>*/}
    {/*</FormTab>*/}
  </TabbedForm>
);


const mapStateToProps = (state) => {
  const resources = getResources(state);
  const siteResource = resources.find(resource => resource.name === 'site');

  return {
    siteId: siteResource && siteResource.options ? siteResource.options.siteId : false
  }
};


export const IdeaEdit = withRouter(connect(mapStateToProps)((props) => {

  /*const { data, loading, error } = useQuery({
      type: 'getOne',
      resource: 'site',
      payload: { id: props.siteId }
  });

  if (loading) return <Loading />;
  if (error) return <Error />;
  if (!data) return null;
*/
  // @TODO, in site.config.ideas is validation rules for
  // form pass to form and add it, maybe move entire logic to form component?

  return (
    <Edit mutationMode="pessimistic" title={<IdeaTitle/>} {...props}>
      <Form {...props} edit/>
    </Edit>
  )
}));

export const IdeaCreate = withRouter(connect(mapStateToProps)((props) => {
    const notify = useNotify();
    const refresh = useRefresh();
    const redirect = useRedirect();

    return <Create title="Create a Idea" {...props} onSuccess={() => {
        notify('ra.notification.created', 'info', {smart_count: 1});
        redirect('/idea');
        refresh()
    }}>
        <Form {...props}/>
    </Create>
}));
