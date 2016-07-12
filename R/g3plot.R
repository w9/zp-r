#' 3D scatter plot on Rstudio viewer
#'
#' @export
#' @examples
#' qplot3(aes(x=x, y=y, z=z, color=pick), data=ret, show_datum=T)
qplot3 <- function(mappings, data, verbose_level=0, show_datum=F) {
  # TODO: mappings sanity check

  folder_name <- '3js'
  temp_dir <- tempdir()
  if (verbose_level > 1) message(sprintf('Creating directory %s', temp_dir))

  if (!file.exists(file.path(temp_dir, folder_name))) {
    plotter_dir <- system.file(folder_name, package='ggplot3')
    file.symlink(plotter_dir, file.path(temp_dir, folder_name))
    if (verbose_level > 1) message(sprintf('Copy %s to %s', plotter_dir, temp_dir))
  }

  options <- list(show_datum=show_datum)

  json_string <- jsonlite::toJSON(list(data=data, mappings=lapply(mappings, as.character), options=options),
                                  dataframe='columns', auto_unbox=T)

  write(json_string, file.path(temp_dir, folder_name, 'query.json'));

  rstudioapi::viewer(paste0(file.path(temp_dir, folder_name, 'index.html')))
}
